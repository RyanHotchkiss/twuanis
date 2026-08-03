import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  createClient
} from '@supabase/supabase-js'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  assignListingOntology
} from '@/lib/assign-listing-ontology'

import {
  recordListingCreated,
  recordListingPublished
} from '@/lib/activity'

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

const STORAGE_BUCKET =
  'listings-images'

const MAX_TEMPORARY_IMAGES =
  25

type PublishTokenRow = {
  id: string
  phone: string
  token: string
  verified: boolean
  listing_data:
    Record<string, unknown> | null
}

type PackageLimitRow = {
  listing_limit: number | null
}

type ActiveSubscriptionRow = {
  id: string
  package_id: string
  package_limits:
    PackageLimitRow[]
}

function generateFallbackTitle(
  data: Record<string, any>
): string {
  const environment =
    data.environment || ''

  const propertyType =
    data.property_type ||
    'property'

  const district =
    data.district || ''

  const canton =
    data.canton || ''

  return `${environment} ${propertyType} in ${district} ${canton}`.trim()
}

function generateFallbackDescription(
  data: Record<string, any>
): string {
  return `This property is located in ${
    data.district ||
    data.canton ||
    data.province ||
    'Costa Rica'
  }.`
}

function getTemporaryImagePaths(
  listingData:
    Record<string, unknown>,
  token: string
): string[] {
  const candidateValues = [
    listingData.temporary_images,
    listingData.images
  ]

  const temporaryPaths =
    candidateValues.flatMap(
      value =>
        Array.isArray(value)
          ? value
          : []
    )

  return Array.from(
    new Set(
      temporaryPaths.filter(
        (
          value
        ): value is string =>
          typeof value ===
            'string' &&
          value.startsWith(
            `temporary/${token}/`
          )
      )
    )
  )
}

async function releasePublishToken(
  tokenId: string | null
) {
  if (!tokenId) return

  await supabaseAdmin
    .from('listing_publish_tokens')
    .update({
      verified: false
    })
    .eq('id', tokenId)
}

async function removeStorageObjects(
      paths: string[],
      throwOnError = false
    ): Promise<void> {
      if (paths.length === 0) {
        return
      }

      const {
        error
      } =
        await supabaseAdmin
          .storage
          .from(
            STORAGE_BUCKET
          )
          .remove(paths)

      if (!error) {
        return
      }

      console.error(
        'STORAGE CLEANUP ERROR:',
        error
      )

      if (throwOnError) {
        throw new Error(
          'Temporary listing images could not be removed.'
        )
      }
    }

export async function POST(
  request: NextRequest
) {
  let createdListingId:
    string | null = null
  
  let claimedPublishTokenId:
  string | null = null

  const copiedImagePaths:
    string[] = []

  try {
    /*
     * Verify the authenticated user.
     */
    const authorization =
      request.headers.get(
        'authorization'
      )

    const accessToken =
      authorization?.startsWith(
        'Bearer '
      )
        ? authorization.slice(7)
        : null

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Authentication required.'
        },
        {
          status: 401
        }
      )
    }

    const authenticatedSupabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          }
        }
      )

    const {
      data: {
        user
      },
      error: userError
    } =
      await authenticatedSupabase
        .auth
        .getUser(accessToken)

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your session could not be verified.'
        },
        {
          status: 401
        }
      )
    }

    const requestBody =
      await request.json()

    const token =
      typeof requestBody.token ===
        'string'
        ? requestBody.token.trim()
        : ''

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Publish token required.'
        },
        {
          status: 400
        }
      )
    }

    /*
     * Verify the publishing token.
     */
    const {
            data: tokenData,
            error: tokenError
          } =
            await supabaseAdmin
              .from(
                'listing_publish_tokens'
              )
              .update({
                verified: true
              })
              .eq(
                'token',
                token
              )
              .eq(
                'verified',
                false
              )
              .select(`
                id,
                phone,
                token,
                verified,
                listing_data
              `)
              .maybeSingle()

          if (tokenError) {
            console.error(
              'PUBLISH TOKEN CLAIM ERROR:',
              tokenError
            )

            return NextResponse.json(
              {
                success: false,
                error:
                  'This publish link could not be verified.'
              },
              {
                status: 500
              }
            )
          }

          if (!tokenData) {
            return NextResponse.json(
              {
                success: false,
                error:
                  'This publish link is invalid, expired, or already being used.'
              },
              {
                status: 409
              }
            )
          }

          const publishToken =
            tokenData as PublishTokenRow

          claimedPublishTokenId =
            publishToken.id

    const propertyData =
      publishToken.listing_data &&
      typeof publishToken
        .listing_data === 'object'
        ? publishToken.listing_data
        : {}

    const temporaryImagePaths =
      getTemporaryImagePaths(
        propertyData,
        token
      )

    if (
      temporaryImagePaths.length >
      MAX_TEMPORARY_IMAGES
    ) {

      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,
          error:
            `A listing may contain no more than ${MAX_TEMPORARY_IMAGES} images.`
        },
        {
          status: 409
        }
      )
    }

    /*
     * Resolve the active package and listing limit.
     */
    const {
      data:
        activeSubscriptionData,
      error:
        activeSubscriptionError
    } =
      await supabaseAdmin
        .from(
          'user_subscriptions'
        )
        .select(`
          id,
          package_id,
          package_limits (
            listing_limit
          )
        `)
        .eq(
          'user_id',
          user.id
        )
        .eq(
          'status',
          'active'
        )
        .maybeSingle()

    if (
      activeSubscriptionError ||
      !activeSubscriptionData
    ) {

      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'An active subscription is required to publish a listing.'
        },
        {
          status: 403
        }
      )
    }

    const activeSubscription =
      activeSubscriptionData as
        ActiveSubscriptionRow

    const listingLimit =
      activeSubscription
        .package_limits?.[0]
        ?.listing_limit ??
      null

    /*
     * Archived and deleted listings do not consume
     * an active-listing slot.
     */
    const {
      count: activeListingCount,
      error: listingCountError
    } =
      await supabaseAdmin
        .from(
          'listings'
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'owner_id',
          user.id
        )
        .eq(
          'listing_status',
          'active'
        )
        .is(
          'deleted_at',
          null
        )

    if (listingCountError) {
      console.error(
        'LISTING LIMIT COUNT ERROR:',
        listingCountError
      )

      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Your listing allowance could not be verified.'
        },
        {
          status: 500
        }
      )
    }

    if (
      listingLimit !== null &&
      (
        activeListingCount ?? 0
      ) >= listingLimit
    ) {

      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,
          error:
            `Your package allows ${listingLimit} active ${
              listingLimit === 1
                ? 'listing'
                : 'listings'
            }. Archive an existing listing or upgrade your package before publishing another.`
        },
        {
          status: 403
        }
      )
    }

    const transactionType =
      propertyData
        .transaction_type ===
      'rent'
        ? 'rent'
        : 'buy'

    /*
     * Insert the listing first, with no final images.
     */
    const {
      data: listingData,
      error: listingError
    } =
      await authenticatedSupabase
        .from(
          'listings'
        )
        .insert([
          {
            owner_id:
              user.id,

            province:
              propertyData.province,

            canton:
              propertyData.canton,

            district:
              propertyData.district,

            property_type:
              propertyData
                .property_type ||
              '',

            bedrooms:
              propertyData.bedrooms,

            bathrooms:
              propertyData.bathrooms,

            parking:
              propertyData.parking,

            year_built_range:
              propertyData
                .year_built_range,

            construction_area:
              propertyData
                .construction_area,

            utility:
              propertyData.utility ||
              [],

            property_area:
              propertyData
                .property_area,

            environment:
              propertyData
                .environment,

            accessibility:
              propertyData
                .accessibility,

            terrain:
              propertyData.terrain ||
              [],

            legal_status:
              propertyData
                .legal_status,

            price_millions:
              propertyData
                .priceMillions ??
              propertyData
                .price_millions ??
              null,

            monthly_price:
              propertyData
                .monthly_price
                ? Number(
                    String(
                      propertyData
                        .monthly_price
                    ).replace(
                      /[^\d]/g,
                      ''
                    )
                  )
                : null,

            transaction_type:
              transactionType,

            listing_status:
              propertyData
                .listing_status ||
              'active',

            currency:
              propertyData.currency ||
              'CRC',

            whatsapp:
              publishToken.phone,

            title:
              propertyData.title ||
              generateFallbackTitle(
                propertyData
              ),

            description:
              propertyData
                .description ||
              generateFallbackDescription(
                propertyData
              ),

            images: []
          }
        ])
        .select()
        .single()

    if (
      listingError ||
      !listingData
    ) {
      console.error(
        'LISTING INSERT ERROR:',
        listingError
      )

      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Your listing could not be published.'
        },
        {
          status: 500
        }
      )
    }

    createdListingId =
      listingData.id

    /*
     * Copy temporary images into their permanent,
     * ownership-aware location.
     */
    for (
      const temporaryPath
      of temporaryImagePaths
    ) {
      const {
        data: temporaryImage,
        error: downloadError
      } =
        await supabaseAdmin
          .storage
          .from(
            STORAGE_BUCKET
          )
          .download(
            temporaryPath
          )

      if (
        downloadError ||
        !temporaryImage
      ) {
        throw new Error(
          `Temporary image could not be downloaded: ${temporaryPath}`
        )
      }

      const permanentPath =
        `${user.id}/${listingData.id}/${crypto.randomUUID()}.jpg`

      const imageBytes =
        new Uint8Array(
          await temporaryImage
            .arrayBuffer()
        )

      const {
        error: permanentUploadError
      } =
        await supabaseAdmin
          .storage
          .from(
            STORAGE_BUCKET
          )
          .upload(
            permanentPath,
            imageBytes,
            {
              contentType:
                'image/jpeg',

              cacheControl:
                '31536000',

              upsert:
                false
            }
          )

      if (permanentUploadError) {
        throw permanentUploadError
      }

      copiedImagePaths.push(
        permanentPath
      )
    }

    /*
     * Store final Storage paths, not public URLs.
     */
    const {
      data:
        listingWithImages,
      error:
        imageUpdateError
    } =
      await supabaseAdmin
        .from(
          'listings'
        )
        .update({
          images:
            copiedImagePaths
        })
        .eq(
          'id',
          listingData.id
        )
        .eq(
          'owner_id',
          user.id
        )
        .select()
        .single()

    if (
      imageUpdateError ||
      !listingWithImages
    ) {
      throw new Error(
        'The listing images could not be attached to the listing.'
      )
    }

    /*
     * Delete temporary images only after every
     * permanent image and database path succeeds.
     */
    await removeStorageObjects(
      temporaryImagePaths,
      true
    )

    /*
     * Ontology and activity execute only after
     * publication and image finalization succeed.
     */
    try {
      await assignListingOntology(
        listingWithImages.id,
        {
          ...propertyData,

          price_millions:
            propertyData
              .priceMillions ??
            propertyData
              .price_millions
        }
      )
    } catch (ontologyError) {
      console.error(
        'ONTOLOGY ERROR:',
        ontologyError
      )
    }

    try {
      const metadata = {
        title:
          listingWithImages.title,

        province:
          listingWithImages
            .province,

        canton:
          listingWithImages.canton,

        district:
          listingWithImages
            .district,

        propertyType:
          listingWithImages
            .property_type,

        transactionType:
          listingWithImages
            .transaction_type,

        status:
          listingWithImages
            .listing_status,

        imageCount:
          copiedImagePaths.length,

        source:
          'authenticated-publish'
      }

      await recordListingCreated({
        listingId:
          listingWithImages.id,
        metadata
      })

      await recordListingPublished({
        listingId:
          listingWithImages.id,
        metadata
      })
    } catch (activityError) {
      console.error(
        'ACTIVITY ERROR:',
        activityError
      )
    }

    const {
      error: tokenUpdateError
    } =
      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .update({
          listing_data: {
            ...propertyData,

            images:
              copiedImagePaths,

            temporary_images: []
          }
        })
        .eq(
          'id',
          publishToken.id
        )

    if (tokenUpdateError) {
      console.error(
        'TOKEN UPDATE ERROR:',
        tokenUpdateError
      )
    }

    const redirectTo =
      transactionType === 'rent'
        ? `/en/rent-lease/listing/${listingWithImages.id}`
        : `/en/buy/listing/${listingWithImages.id}`

    return NextResponse.json({
      success: true,
      listingId:
        listingWithImages.id,
      redirectTo
    })
  } catch (error) {
    console.error(
      'PUBLISH ROUTE ERROR:',
      error
    )

    /*
     * Clean up permanent files created during
     * this failed request.
     */
    await removeStorageObjects(
      copiedImagePaths
    )

    /*
     * Remove the incomplete listing while keeping
     * temporary images and the publish token so
     * the user can retry safely.
     */
    if (createdListingId) {
      const {
        error: rollbackError
      } =
        await supabaseAdmin
          .from(
            'listings'
          )
          .delete()
          .eq(
            'id',
            createdListingId
          )

      if (rollbackError) {
        console.error(
          'INCOMPLETE LISTING ROLLBACK ERROR:',
          rollbackError
        )
      }
    }

    await releasePublishToken(
      claimedPublishTokenId
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while publishing your listing.'
      },
      {
        status: 500
      }
    )
  }
}
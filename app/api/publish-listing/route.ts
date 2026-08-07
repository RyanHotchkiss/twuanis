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
  resolveUserPackageUsage
} from '@/lib/package-usage'

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

  claimed_at:
    string | null

  published_at:
    string | null

  published_listing_id:
    string | null

  listing_data:
    Record<string, unknown> | null
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
      if (!tokenId) {
        return
      }

      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .update({
          claimed_at:
            null
        })
        .eq(
          'id',
          tokenId
        )
        .is(
          'published_at',
          null
        )
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

console.log(
  'PUBLISH ROUTE STARTED'
)

  let createdListingId:
    string | null = null
  
  let claimedPublishTokenId:
  string | null = null

  const copiedImagePaths:
    string[] = []

  let temporaryImageBytes = 0

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
          claimed_at:
            new Date()
              .toISOString()
        })
        .eq(
          'token',
          token
        )
        .is(
          'published_at',
          null
        )
        .is(
          'published_listing_id',
          null
        )
        .select(`
          id,
          phone,
          token,
          verified,
          claimed_at,
          published_at,
          published_listing_id,
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
    * Resolve centralized package usage.
    */
    let packageUsage

    try {
      packageUsage =
        await resolveUserPackageUsage({
          supabase:
            supabaseAdmin,

          userId:
            user.id
        })
    } catch (usageError) {
      console.error(
        'PACKAGE USAGE ERROR:',
        usageError
      )

      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Your package allowance could not be verified.'
        },
        {
          status: 500
        }
      )
    }

    /*
    * Enforce the active-listing limit before
    * inserting a new listing.
    */
    if (
      packageUsage.listingLimit !==
        null &&
      packageUsage.listingsUsed >=
        packageUsage.listingLimit
    ) {
      await releasePublishToken(
        claimedPublishTokenId
      )

      return NextResponse.json(
        {
          success: false,

          code:
            'LISTING_LIMIT_EXCEEDED',

          error:
            `Your package allows ${packageUsage.listingLimit} active ${
              packageUsage.listingLimit === 1
                ? 'listing'
                : 'listings'
            }. Archive an existing listing or upgrade your package before publishing another.`
        },
        {
          status: 403
        }
      )
    }

    /*
    * Calculate the total size of every temporary
    * image before inserting the listing.
    */
    for (
      const temporaryPath
      of temporaryImagePaths
    ) {
      const {
        data: temporaryImage,
        error: temporaryImageError
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
        temporaryImageError ||
        !temporaryImage
      ) {
        await releasePublishToken(
          claimedPublishTokenId
        )

        return NextResponse.json(
          {
            success: false,
            error:
              'A temporary image could not be verified.'
          },
          {
            status: 500
          }
        )
      }

      temporaryImageBytes +=
        (
          await temporaryImage
            .arrayBuffer()
        ).byteLength
    }

    /*
    * Enforce projected Storage usage before
    * inserting or copying anything.
    */
    if (
      packageUsage.storageLimitBytes !==
        null &&
      packageUsage.storageUsedBytes +
        temporaryImageBytes >
          packageUsage.storageLimitBytes
    ) {
      await releasePublishToken(
        claimedPublishTokenId
      )

      const remainingStorageBytes =
        Math.max(
          0,
          packageUsage.storageLimitBytes -
          packageUsage.storageUsedBytes
        )

      return NextResponse.json(
        {
          success: false,

          code:
            'STORAGE_LIMIT_EXCEEDED',

          error:
            'Publishing this listing would exceed your package Storage allowance.',

          storageUsedBytes:
            packageUsage.storageUsedBytes,

          storageLimitBytes:
            packageUsage.storageLimitBytes,

          incomingStorageBytes:
            temporaryImageBytes,

          remainingStorageBytes
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
        : 'sale'

    /*
     * Insert the listing first, with no final images.
     */

console.log(
  'ABOUT TO INSERT LISTING'
)

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

console.log(
  'LISTING INSERTED',
  listingData.id
)

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

              temporary_images:
                []
            },

            claimed_at:
              null,

            published_at:
              new Date()
                .toISOString(),

            published_listing_id:
              listingWithImages.id,

            verified:
              true
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
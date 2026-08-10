import {
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  resolvePublicPromotionEvidence,
  type PublicPromotionEvidence
} from '@/lib/public-promotion-evidence'

import type {
  PromotionProductSlug
} from '@/lib/promotion-catalog'


type PublicPromotionEvidenceMap =
  Record<
    string,
    PublicPromotionEvidence | null
  >


type RequestBody = {
  promotionSlugs?:
    string[]

  propertyType?:
    string | null

  province?:
    string | null

  canton?:
    string | null

  district?:
    string | null

  transactionType?:
    string | null
}


export async function POST(
  request:
    Request
) {

  try {

    const body =
      await request.json() as RequestBody


    const promotionSlugs =
      Array.from(
        new Set(
          (
            body.promotionSlugs ??
            []
          )
            .map(
              slug =>
                slug.trim()
            )
            .filter(
              Boolean
            )
        )
      )


    /*
     * Nothing to resolve.
     */

    if (
      promotionSlugs.length ===
        0
    ) {

      return NextResponse.json({
        evidence:
          {}
      })
    }


    /*
     * -----------------------------------------------------
     * VERIFY PUBLIC PROMOTION PRODUCTS
     * -----------------------------------------------------
     *
     * Never allow arbitrary client strings to become
     * evidence-resolution targets.
     */


    const {
      data:
        products,

      error:
        productsError
    } =
      await supabaseAdmin
        .from(
          'add_on_products'
        )
        .select(`
          slug
        `)
        .in(
          'slug',
          promotionSlugs
        )
        .eq(
          'product_type',
          'promotion'
        )
        .eq(
          'target_type',
          'listing'
        )
        .eq(
          'is_active',
          true
        )


    if (
      productsError
    ) {

      throw new Error(
        `Promotion catalog could not be resolved: ${productsError.message}`
      )
    }


    const verifiedSlugs =
      (
        products ??
        []
      )
        .map(
          product =>
            product.slug
        )
        .filter(
          (
            slug
          ): slug is string =>
            typeof slug ===
              'string' &&
            slug.length >
              0
        )


    const evidence:
      PublicPromotionEvidenceMap =
        {}


    /*
     * -----------------------------------------------------
     * RESOLVE DISPLAY-SAFE EVIDENCE
     * -----------------------------------------------------
     */


    await Promise.all(
      verifiedSlugs.map(
        async slug => {

          const result =
            await resolvePublicPromotionEvidence({
              supabase:
                supabaseAdmin,

              promotionSlug:
                slug as PromotionProductSlug,

              propertyType:
                body.propertyType ??
                null,

              province:
                body.province ??
                null,

              canton:
                body.canton ??
                null,

              district:
                body.district ??
                null,

              transactionType:
                body.transactionType ??
                null
            })


          /*
           * The commercial UI only receives evidence that
           * has actually earned publication.
           *
           * Insufficient evidence becomes null.
           */


          evidence[
            slug
          ] =
            result.publishable
              ? result
              : null
        }
      )
    )


    return NextResponse.json({
      evidence
    })

  } catch (
    error
  ) {

    console.error(
      'Public Promotion Evidence API failed:',
      error
    )


    /*
     * Fail closed.
     *
     * Evidence is supplemental commercial information.
     * Failure must never invent evidence or expose raw
     * analytical state.
     */


    return NextResponse.json(
      {
        evidence:
          {}
      },
      {
        status:
          500
      }
    )
  }
}
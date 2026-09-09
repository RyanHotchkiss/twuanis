import type {
  PriceMeterCrossDimensionalQuestionDefinition,
  PriceMeterCrossDimensionalQuestionKey
} from '@/lib/price-meter-cross-dimensional-question'


export type PriceMeterCrossDimensionalLanguage =
  | 'en'
  | 'es'


type LocalizedQuestionPresentation = {
  definition:
    string

  question:
    string
}


const SPANISH_QUESTION_PRESENTATION:
  Record<
    PriceMeterCrossDimensionalQuestionKey,
    LocalizedQuestionPresentation
  > = {

  geography_by_property_area: {
    definition:
      'Examina si y cómo cambia la relación geográfica observada de Precio / m² entre las cohortes canónicas de Área de la Propiedad.',

    question:
      '¿El orden y las diferencias geográficas de Precio / m² observados en este mercado persisten, varían o se revierten entre las cohortes de Área de la Propiedad?'
  },

  geography_by_construction_area: {
    definition:
      'Examina si y cómo cambia la relación geográfica observada de Precio / m² entre las cohortes canónicas de Área de Construcción.',

    question:
      '¿El orden y las diferencias geográficas de Precio / m² observados en este mercado persisten, varían o se revierten entre las cohortes de Área de Construcción?'
  },

  geography_by_construction_to_land: {
    definition:
      'Examina si y cómo cambia la relación geográfica observada de Precio / m² entre las cohortes canónicas de Construcción a Terreno.',

    question:
      '¿El orden y las diferencias geográficas de Precio / m² observados en este mercado persisten, varían o se revierten entre las cohortes de Construcción a Terreno?'
  },

  property_area_by_geography: {
    definition:
      'Examina si y cómo cambia la relación observada entre el Área de la Propiedad y el Precio / m² normalizado por terreno entre poblaciones geográficas canónicas.',

    question:
      '¿La relación Área de la Propiedad → Precio / m² normalizado por terreno persiste, varía o se revierte entre poblaciones geográficas?'
  },

  property_area_by_construction_to_land: {
    definition:
      'Examina si y cómo cambia la relación observada entre el Área de la Propiedad y el Precio / m² normalizado por terreno entre poblaciones canónicas de Construcción a Terreno.',

    question:
      '¿La relación Área de la Propiedad → Precio / m² normalizado por terreno persiste, varía o se revierte entre cohortes de Construcción a Terreno?'
  },

  construction_area_by_geography: {
    definition:
      'Examina si y cómo cambia la relación observada entre el Área de Construcción y el Precio / m² normalizado por construcción entre poblaciones geográficas canónicas.',

    question:
      '¿La relación Área de Construcción → Precio / m² normalizado por construcción persiste, varía o se revierte entre poblaciones geográficas?'
  },

  construction_area_by_construction_to_land: {
    definition:
      'Examina si y cómo cambia la relación observada entre el Área de Construcción y el Precio / m² normalizado por construcción entre poblaciones canónicas de Construcción a Terreno.',

    question:
      '¿La relación Área de Construcción → Precio / m² normalizado por construcción persiste, varía o se revierte entre cohortes de Construcción a Terreno?'
  },

  construction_to_land_by_geography: {
    definition:
      'Examina si y cómo cambia la relación observada entre Construcción a Terreno y Precio / m² entre poblaciones geográficas canónicas.',

    question:
      '¿La relación Construcción a Terreno → Precio / m² persiste, varía o se revierte entre poblaciones geográficas?'
  },

  construction_to_land_by_property_area: {
    definition:
      'Examina si y cómo cambia la relación observada Construcción a Terreno → Precio / m² entre poblaciones canónicas de Área de la Propiedad.',

    question:
      '¿La relación Construcción a Terreno → Precio / m² persiste, varía o se revierte entre poblaciones de Área de la Propiedad?'
  },

  construction_to_land_by_construction_area: {
    definition:
      'Examina si y cómo cambia la relación observada Construcción a Terreno → Precio / m² entre poblaciones canónicas de Área de Construcción.',

    question:
      '¿La relación Construcción a Terreno → Precio / m² persiste, varía o se revierte entre poblaciones de Área de Construcción?'
  }
}


const SPANISH_REPORT_LABELS:
  Record<
    string,
    string
  > = {

  geographic_median_price_per_m2:
    'medianas geográficas de Precio / m²',

  represented_property_populations:
    'poblaciones de propiedades representadas',

  absolute_differences:
    'diferencias absolutas',

  percentage_differences_with_explicit_reference_populations:
    'diferencias porcentuales con poblaciones de referencia explícitas',

  geographic_ordering:
    'orden geográfico',

  canonical_property_area_cohort_medians:
    'medianas de las cohortes canónicas de Área de la Propiedad',

  canonical_construction_area_cohort_medians:
    'medianas de las cohortes canónicas de Área de Construcción',

  canonical_construction_to_land_cohort_medians:
    'medianas de las cohortes canónicas de Construcción a Terreno',

  populated_cohort_counts:
    'número de cohortes con datos',

  spearman_rho_where_authorized:
    'Spearman ρ cuando está autorizado',

  spearman_rho_where_analytically_authorized:
    'Spearman ρ cuando está analíticamente autorizado',

  spearman_rho_where_phase_9_requirements_are_met:
    'Spearman ρ cuando se cumplen los requisitos de la Fase 9',

  modeled_relationship_statistics_where_authorized:
    'estadísticas modeladas de la relación cuando están autorizadas',

  modeled_relationship_statistics_only_where_explicitly_authorized:
    'estadísticas modeladas únicamente cuando están explícitamente autorizadas',

  r_squared_where_authorized:
    'R² cuando está autorizado',

  persistence:
    'Persistencia',

  variation:
    'Variación',

  reversal:
    'Reversión',

  non_establishment:
    'No establecimiento'
}


function englishReportLabel(
  report:
    string
): string {

  return report
    .replaceAll(
      '_',
      ' '
    )
}


export function getPriceMeterCrossDimensionalPresentation({
  question,
  language
}: {
  question:
    PriceMeterCrossDimensionalQuestionDefinition

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  if (
    language ===
      'en'
  ) {
    return {
      definition:
        question.definition,

      question:
        question.question,

      reports:
        question.reports.map(
          englishReportLabel
        )
    }
  }


  const localized =
    SPANISH_QUESTION_PRESENTATION[
      question.key
    ]


  return {
    definition:
      localized.definition,

    question:
      localized.question,

    reports:
      question.reports.map(
        report =>
          SPANISH_REPORT_LABELS[
            report
          ] ??
          report.replaceAll(
            '_',
            ' '
          )
      )
  }
}
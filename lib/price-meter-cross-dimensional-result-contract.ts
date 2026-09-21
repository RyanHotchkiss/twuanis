// Presentation-only types. No runtime analytical or authorization dependencies.

export type PriceMeterCrossDimensionalQuestionKey = 'geography_by_property_area' | 'geography_by_construction_area' | 'geography_by_construction_to_land' | 'property_area_by_geography' | 'property_area_by_construction_to_land' | 'construction_area_by_geography' | 'construction_area_by_construction_to_land' | 'construction_to_land_by_geography' | 'construction_to_land_by_property_area' | 'construction_to_land_by_construction_area';

export type PriceMeterCrossDimensionalEvidenceStatus = 'established' | 'not_established';

export type PriceMeterCrossDimensionalEvidenceBase = {
    secondaryCohortKey: string;
    secondaryCohortLabel: string;
    representedObservationCount: number;
    status: PriceMeterCrossDimensionalEvidenceStatus;
};

export type PriceMeterCrossDimensionalGeographicCohortStatistic = {
    geographyKey: string;
    geographyLabel: string;
    rank: number;
    sampleSize: number;
    medianPricePerM2: number | null;
    medianDifferenceFromSelectedMarket: number | null;
    medianPercentAboveOrBelowSelectedMarket: number | null;
};

export type PriceMeterCrossDimensionalGeographicEvidence = PriceMeterCrossDimensionalEvidenceBase & {
    kind: 'geographic';
    selectedMarketSampleSize: number;
    selectedMarketMedianPricePerM2: number | null;
    comparisonGeographyCount: number;
    geographicStatistics: PriceMeterCrossDimensionalGeographicCohortStatistic[];
};

export type PriceMeterCrossDimensionalSizeCoordinate = {
    areaM2: number;
    normalizedPricePerM2: number;
    observationCount: number;
};

export type PriceMeterCrossDimensionalSizeEvidence = {
    secondaryCohortKey: string;
    secondaryCohortLabel: string;
    kind: 'size_relationship';
    representedObservationCount: number;
    populatedBandCount: number;
    requiredPopulatedBandCount: number;
    coordinates: PriceMeterCrossDimensionalSizeCoordinate[];
    spearmanRho: number | null;
    logLogSlope: number | null;
    modeledTenPercentAreaChangePercent: number | null;
    rSquared: number | null;
    modeledStatisticsAuthorization: 'authorized' | 'withheld_mathematical_coupling';
    modeledStatisticsWithheldReason: 'property_area_construction_to_land_coupling' | 'construction_area_construction_to_land_coupling' | null;
    status: PriceMeterCrossDimensionalEvidenceStatus;
};

export type PriceMeterCrossDimensionalConstructionLandCoordinate = {
    constructionToLandRatio: number;
    normalizedPricePerM2: number;
    observationCount: number;
};

export type PriceMeterCrossDimensionalConstructionLandEvidence = {
    secondaryCohortKey: string;
    secondaryCohortLabel: string;
    kind: 'construction_to_land_relationship';
    normalizationBasis: 'land' | 'construction';
    representedObservationCount: number;
    populatedCohortCount: number;
    requiredPopulatedCohortCount: 3;
    requiredObservationCount: 12;
    coordinates: PriceMeterCrossDimensionalConstructionLandCoordinate[];
    spearmanRho: number | null;
    regressionWithheldReason: 'shared_property_area_mathematical_coupling' | 'shared_construction_area_mathematical_coupling';
    status: PriceMeterCrossDimensionalEvidenceStatus;
};

export type PriceMeterCrossDimensionalEvidence = PriceMeterCrossDimensionalGeographicEvidence | PriceMeterCrossDimensionalSizeEvidence | PriceMeterCrossDimensionalConstructionLandEvidence;

export type PriceMeterCrossDimensionalEvidenceSet = {
    inputObservationCount: number;
    representedObservationCount: number;
    excludedObservationCount: number;
    populatedSecondaryCohortCount: number;
    evidence: PriceMeterCrossDimensionalEvidence[];
};

export type PriceMeterCrossDimensionalDirection = 'positive' | 'negative' | 'zero';

export type PriceMeterCrossDimensionalPersistence = {
    examinedSecondaryCohortCount: number;
    establishedSecondaryCohortCount: number;
    nonEstablishedSecondaryCohortCount: number;
    persistenceRatePercent: number | null;
    representedObservationCount: number;
    establishedObservationCount: number;
};

export type PriceMeterCrossDimensionalGeographicVariation = {
    kind: 'geographic';
    establishedSecondaryCohortCount: number;
    observedMedianDifferenceMinimum: number | null;
    observedMedianDifferenceMaximum: number | null;
    observedMedianDifferenceRange: number | null;
    observedPercentDifferenceMinimum: number | null;
    observedPercentDifferenceMaximum: number | null;
    observedPercentDifferenceRange: number | null;
};

export type PriceMeterCrossDimensionalSizeVariation = {
    kind: 'size_relationship';
    establishedSecondaryCohortCount: number;
    spearmanRhoMinimum: number | null;
    spearmanRhoMaximum: number | null;
    spearmanRhoRange: number | null;
    logLogSlopeMinimum: number | null;
    logLogSlopeMaximum: number | null;
    logLogSlopeRange: number | null;
    modeledTenPercentAreaChangeMinimum: number | null;
    modeledTenPercentAreaChangeMaximum: number | null;
    modeledTenPercentAreaChangeRange: number | null;
    rSquaredMinimum: number | null;
    rSquaredMaximum: number | null;
    rSquaredRange: number | null;
};

export type PriceMeterCrossDimensionalConstructionLandVariation = {
    kind: 'construction_to_land_relationship';
    establishedSecondaryCohortCount: number;
    spearmanRhoMinimum: number | null;
    spearmanRhoMaximum: number | null;
    spearmanRhoRange: number | null;
};

export type PriceMeterCrossDimensionalVariation = PriceMeterCrossDimensionalGeographicVariation | PriceMeterCrossDimensionalSizeVariation | PriceMeterCrossDimensionalConstructionLandVariation;

export type PriceMeterCrossDimensionalDirectionalReversal = {
    kind: 'directional';
    firstSecondaryCohortKey: string;
    firstSecondaryCohortLabel: string;
    secondSecondaryCohortKey: string;
    secondSecondaryCohortLabel: string;
    firstDirection: PriceMeterCrossDimensionalDirection;
    secondDirection: PriceMeterCrossDimensionalDirection;
    firstSpearmanRho: number;
    secondSpearmanRho: number;
};

export type PriceMeterCrossDimensionalGeographicReversalStatistic = {
    geographyKey: string;
    geographyLabel: string;
    medianPricePerM2: number;
    sampleSize: number;
};

export type PriceMeterCrossDimensionalGeographicReversal = {
    kind: 'geographic_ordering';
    firstSecondaryCohortKey: string;
    firstSecondaryCohortLabel: string;
    secondSecondaryCohortKey: string;
    secondSecondaryCohortLabel: string;
    firstCohortFirstGeography: PriceMeterCrossDimensionalGeographicReversalStatistic;
    firstCohortSecondGeography: PriceMeterCrossDimensionalGeographicReversalStatistic;
    secondCohortFirstGeography: PriceMeterCrossDimensionalGeographicReversalStatistic;
    secondCohortSecondGeography: PriceMeterCrossDimensionalGeographicReversalStatistic;
};

export type PriceMeterCrossDimensionalReversal = PriceMeterCrossDimensionalDirectionalReversal | PriceMeterCrossDimensionalGeographicReversal;

export type PriceMeterCrossDimensionalNonEstablishmentReason = {
    kind: 'geographic_relationship_not_established';
    representedObservationCount: number;
    comparisonGeographyCount: number;
    requiredComparisonGeographyCount: number;
} | {
    kind: 'size_relationship_not_established';
    representedObservationCount: number;
    populatedBandCount: number;
    requiredPopulatedBandCount: number;
} | {
    kind: 'construction_to_land_relationship_not_established';
    representedObservationCount: number;
    populatedCohortCount: number;
    requiredPopulatedCohortCount: number;
    requiredObservationCount: number;
};

export type PriceMeterCrossDimensionalNonEstablishment = {
    secondaryCohortKey: string;
    secondaryCohortLabel: string;
    reason: PriceMeterCrossDimensionalNonEstablishmentReason;
};

export type PriceMeterCrossDimensionalOutcomes = {
    persistence: PriceMeterCrossDimensionalPersistence;
    variation: PriceMeterCrossDimensionalVariation | null;
    reversals: PriceMeterCrossDimensionalReversal[];
    nonEstablishment: PriceMeterCrossDimensionalNonEstablishment[];
};

export type PriceMeterCrossDimensionalGeographicVariationSynthesis = {
    kind: 'geographic';
    establishedSecondaryCohortCount: number;
    observedMedianDifferenceMinimum: number | null;
    observedMedianDifferenceMaximum: number | null;
    observedMedianDifferenceRange: number | null;
    observedPercentDifferenceMinimum: number | null;
    observedPercentDifferenceMaximum: number | null;
    observedPercentDifferenceRange: number | null;
};

export type PriceMeterCrossDimensionalSizeVariationSynthesis = {
    kind: 'size_relationship';
    establishedSecondaryCohortCount: number;
    spearmanRhoMinimum: number | null;
    spearmanRhoMaximum: number | null;
    spearmanRhoRange: number | null;
    logLogSlopeMinimum: number | null;
    logLogSlopeMaximum: number | null;
    logLogSlopeRange: number | null;
    modeledTenPercentAreaChangeMinimum: number | null;
    modeledTenPercentAreaChangeMaximum: number | null;
    modeledTenPercentAreaChangeRange: number | null;
    rSquaredMinimum: number | null;
    rSquaredMaximum: number | null;
    rSquaredRange: number | null;
};

export type PriceMeterCrossDimensionalConstructionLandVariationSynthesis = {
    kind: 'construction_to_land_relationship';
    establishedSecondaryCohortCount: number;
    spearmanRhoMinimum: number | null;
    spearmanRhoMaximum: number | null;
    spearmanRhoRange: number | null;
};

export type PriceMeterCrossDimensionalVariationSynthesis = PriceMeterCrossDimensionalGeographicVariationSynthesis | PriceMeterCrossDimensionalSizeVariationSynthesis | PriceMeterCrossDimensionalConstructionLandVariationSynthesis;

export type PriceMeterCrossDimensionalSynthesis = {
    representedObservationCount: number;
    examinedSecondaryCohortCount: number;
    establishedSecondaryCohortCount: number;
    establishedObservationCount: number;
    variation: PriceMeterCrossDimensionalVariationSynthesis | null;
    reversalCount: number;
    nonEstablishmentCount: number;
    hasReversal: boolean;
    hasNonEstablishment: boolean;
};

export type PriceMeterCrossDimensionalQuestionPresentation = {
    key: PriceMeterCrossDimensionalQuestionKey;
    definition: string;
    question: string;
    reports: readonly string[];
};

export type PriceMeterCrossDimensionalResult = {
    question: PriceMeterCrossDimensionalQuestionPresentation;
    context: {
        transactionType: 'sale' | 'rent';
        propertyBasis: 'land_only' | 'improved_property';
        normalizationBasis: 'land' | 'construction';
    };
    evidence: PriceMeterCrossDimensionalEvidenceSet;
    outcomes: PriceMeterCrossDimensionalOutcomes;
    synthesis: PriceMeterCrossDimensionalSynthesis;
};


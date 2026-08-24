/*
 * ---------------------------------------------------------
 * PRICE / M² SIZE-RELATIONSHIP MATHEMATICS
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Provide generic mathematical operations used to measure
 * relationships between an area variable and a normalized
 * total-price ratio.
 *
 * This layer is intentionally unaware of analytical meaning.
 *
 * It DOES NOT decide:
 *
 * - whether area means property area or construction area
 * - whether the ratio is land-normalized or
 *   construction-normalized
 * - transaction type
 * - property basis
 * - geography
 * - analytical currency
 * - whether a cohort relationship has sufficient evidence
 * - how results are described to users
 *
 * Those analytical identities and evidence requirements
 * belong to downstream Price / m² domain logic.
 */

export type PriceMeterSizeRelationshipCoordinate = {
  area: number
  ratio: number
}


export type PriceMeterSizeRelationshipEvidence = {
  populatedBandCount: number
  representedObservationCount: number
  hasSufficientBandEvidence: boolean
}


export type PriceMeterSizeRelationshipRegression = {
  alpha: number
  beta: number
  modeledTenPercentAreaChange: number | null
  rSquared: number | null
}


export type PriceMeterSizeRelationshipResult = {
  evidence:
    PriceMeterSizeRelationshipEvidence

  coordinates:
    PriceMeterSizeRelationshipCoordinate[]

  spearmanRho:
    number | null

  regression:
    PriceMeterSizeRelationshipRegression | null
}

export function buildPriceMeterSizeRelationshipEvidence(
  coordinates:
    PriceMeterSizeRelationshipCoordinate[],
  representedObservationCount:
    number
): PriceMeterSizeRelationshipEvidence {

  const populatedBandCount =
    coordinates.length


  return {
    populatedBandCount,

    representedObservationCount,

    hasSufficientBandEvidence:
      populatedBandCount >= 3
  }
}

export function rankValues(
      values: number[]
    ): number[] {

      const indexed =
        values
          .map(
            (
              value,
              index
            ) => ({
              value,
              index
            })
          )
          .sort(
            (a, b) =>
              a.value - b.value
          )


      const ranks =
        new Array<number>(
          values.length
        )


      let position = 0


      while (
        position <
        indexed.length
      ) {

        let end =
          position


        while (
          end + 1 <
            indexed.length &&
          indexed[end + 1]
            .value ===
            indexed[position]
              .value
        ) {
          end += 1
        }


        /*
        * Ranks are 1-based.
        *
        * If tied values occupy multiple
        * positions, each receives the
        * average of those ranks.
        */

        const averageRank =
          (
            (position + 1) +
            (end + 1)
          ) / 2


        for (
          let i = position;
          i <= end;
          i += 1
        ) {
          ranks[
            indexed[i].index
          ] =
            averageRank
        }


        position =
          end + 1
      }


      return ranks
    }


    export function calculatePearsonCorrelation(
        xValues: number[],
        yValues: number[]
      ): number | null {

        if (
          xValues.length !==
            yValues.length ||
          xValues.length < 2
        ) {
          return null
        }


        const n =
          xValues.length


        const meanX =
          xValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / n


        const meanY =
          yValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / n


        let covarianceSum = 0
        let xSquaredSum = 0
        let ySquaredSum = 0


        for (
          let i = 0;
          i < n;
          i += 1
        ) {

          const xDifference =
            xValues[i] -
            meanX


          const yDifference =
            yValues[i] -
            meanY


          covarianceSum +=
            xDifference *
            yDifference


          xSquaredSum +=
            xDifference *
            xDifference


          ySquaredSum +=
            yDifference *
            yDifference
        }


        const denominator =
          Math.sqrt(
            xSquaredSum *
            ySquaredSum
          )


        if (
          denominator === 0
        ) {
          return null
        }


        return (
          covarianceSum /
          denominator
        )
      }

  export function calculateSpearmanCorrelation(
        xValues: number[],
        yValues: number[]
      ): number | null {

        if (
          xValues.length !==
            yValues.length ||
          xValues.length < 3
        ) {
          return null
        }


        const xRanks =
          rankValues(
            xValues
          )


        const yRanks =
          rankValues(
            yValues
          )


        return (
          calculatePearsonCorrelation(
            xRanks,
            yRanks
          )
        )
      }
export function calculateLogLogRegression(
      xValues: number[],
      yValues: number[]
    ): {
      alpha: number
      beta: number
    } | null {

      if (
        xValues.length !== yValues.length ||
        xValues.length < 3
      ) {
        return null
      }


      if (
        xValues.some(value => value <= 0) ||
        yValues.some(value => value <= 0)
      ) {
        return null
      }


      const logX =
        xValues.map(
          value =>
            Math.log(value)
        )


      const logY =
        yValues.map(
          value =>
            Math.log(value)
        )


      const n =
        logX.length


      const meanX =
        logX.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / n


      const meanY =
        logY.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / n


      let numerator = 0
      let denominator = 0


      for (
        let i = 0;
        i < n;
        i += 1
      ) {

        const xDifference =
          logX[i] -
          meanX


        const yDifference =
          logY[i] -
          meanY


        numerator +=
          xDifference *
          yDifference


        denominator +=
          xDifference *
          xDifference
      }


      if (
        denominator === 0
      ) {
        return null
      }


      const beta =
        numerator /
        denominator


      const alpha =
        meanY -
        beta *
        meanX


      return {
        alpha,
        beta
      }
    }
export function calculateModeledAreaChange(
      beta: number,
      areaChangePercent: number
    ): number | null {

      if (
        areaChangePercent <= -100
      ) {
        return null
      }


      const areaMultiplier =
        1 +
        areaChangePercent / 100


      return (
          Math.pow(
            areaMultiplier,
            beta
          ) -
          1
        ) * 100
      }

      export function calculateLogLogRSquared(
        xValues: number[],
        yValues: number[],
        alpha: number,
        beta: number
      ): number | null {

        if (
          xValues.length !== yValues.length ||
          xValues.length < 3
        ) {
          return null
        }


        if (
          xValues.some(value => value <= 0) ||
          yValues.some(value => value <= 0)
        ) {
          return null
        }


        const logX =
          xValues.map(
            value =>
              Math.log(value)
          )


        const logY =
          yValues.map(
            value =>
              Math.log(value)
          )


        const meanY =
          logY.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          logY.length


        let residualSumOfSquares = 0
        let totalSumOfSquares = 0


        for (
          let i = 0;
          i < logY.length;
          i += 1
        ) {

          const predictedY =
            alpha +
            beta *
            logX[i]


          const residual =
            logY[i] -
            predictedY


          residualSumOfSquares +=
            residual *
            residual


          const meanDifference =
            logY[i] -
            meanY


          totalSumOfSquares +=
            meanDifference *
            meanDifference
        }


        if (
          totalSumOfSquares === 0
        ) {
          return null
        }


        return (
          1 -
          residualSumOfSquares /
          totalSumOfSquares
        )
      }

      export function buildPriceMeterSizeRelationshipResult({
  coordinates,
  representedObservationCount
}: {
  coordinates:
    PriceMeterSizeRelationshipCoordinate[]

  representedObservationCount:
    number
}): PriceMeterSizeRelationshipResult {

  const evidence =
    buildPriceMeterSizeRelationshipEvidence(
      coordinates,
      representedObservationCount
    )


  if (
    !evidence
      .hasSufficientBandEvidence
  ) {

    return {
      evidence,

      coordinates,

      spearmanRho:
        null,

      regression:
        null
    }
  }


  const xValues =
    coordinates.map(
      coordinate =>
        coordinate.area
    )


  const yValues =
    coordinates.map(
      coordinate =>
        coordinate.ratio
    )


  const spearmanRho =
    calculateSpearmanCorrelation(
      xValues,
      yValues
    )


  const logLogRegression =
    calculateLogLogRegression(
      xValues,
      yValues
    )


  const modeledTenPercentAreaChange =
    logLogRegression
      ? calculateModeledAreaChange(
          logLogRegression.beta,
          10
        )
      : null


  const rSquared =
    logLogRegression
      ? calculateLogLogRSquared(
          xValues,
          yValues,
          logLogRegression.alpha,
          logLogRegression.beta
        )
      : null


  return {
    evidence,

    coordinates,

    spearmanRho,

    regression:
      logLogRegression
        ? {
            alpha:
              logLogRegression.alpha,

            beta:
              logLogRegression.beta,

            modeledTenPercentAreaChange,

            rSquared
          }
        : null
  }
}

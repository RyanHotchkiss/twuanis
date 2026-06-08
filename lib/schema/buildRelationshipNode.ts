import {
  ontologyId,
  type OntologyTerm
} from './buildOntologyNode'

export function buildRelationshipNode(
  sourceTerm: OntologyTerm,
  targetTerm: OntologyTerm,
  relationshipType: string
) {

  if (relationshipType === 'is_part_of') {

    return {
      '@id': ontologyId(sourceTerm),
      containedInPlace: {
        '@id': ontologyId(targetTerm)
      }
    }

  }

  if (relationshipType === 'can_be_described_by') {

    return {
      '@id': ontologyId(sourceTerm),
      subjectOf: [
        {
          '@id': ontologyId(targetTerm)
        }
      ]
    }

  }

  if (
    relationshipType === 'commonly_found_in_environment'
  ) {

    return {
      '@id': ontologyId(sourceTerm),
      relatedLink: [
        {
          '@id': ontologyId(targetTerm)
        }
      ]
    }

  }

  if (
    relationshipType === 'commonly_has_terrain'
  ) {

    return {
      '@id': ontologyId(sourceTerm),
      relatedLink: [
        {
          '@id': ontologyId(targetTerm)
        }
      ]
    }

  }

  return null
}
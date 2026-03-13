import { structureBuilder } from 'sanity/structure'

export default structureBuilder.list().title('Jazz Bands CMS').items([
  structureBuilder.documentTypeList('band').title('Bands'),
  structureBuilder.documentTypeList('musician').title('Musicians'),
  structureBuilder.divider(),
  structureBuilder.documentTypeList('recording').title('Recordings'),
  structureBuilder.documentTypeList('tourDate').title('Tour Dates'),
  structureBuilder.divider(),
  structureBuilder.documentTypeList('bandMember').title('Band Members'),
  structureBuilder.documentTypeList('musicianBandOverride').title('Musician Band Overrides'),
])

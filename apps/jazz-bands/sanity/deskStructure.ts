import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Jazz Bands CMS')
    .items([
      S.documentTypeListItem('band').title('Bands'),
      S.documentTypeListItem('musician').title('Musicians'),
      S.divider(),
      S.documentTypeListItem('recording').title('Recordings'),
      S.documentTypeListItem('tourDate').title('Tour Dates'),
      S.divider(),
      S.documentTypeListItem('bandMember').title('Band Members'),
      S.documentTypeListItem('musicianBandOverride').title(
        'Musician Band Overrides',
      ),
    ])

export default structure

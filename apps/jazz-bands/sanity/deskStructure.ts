import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('CMS Jazz Bands')
    .items([
      S.documentTypeListItem('band').title('Groupes'),
      S.documentTypeListItem('musician').title('Musiciens'),
      S.divider(),
      S.documentTypeListItem('recording').title('Enregistrements'),
      S.documentTypeListItem('tourDate').title('Dates de Concerts'),
      S.divider(),
      S.documentTypeListItem('bandMember').title('Membres de Groupe'),
      S.documentTypeListItem('musicianBandOverride').title(
        'Substitutions de Musicien',
      ),
    ])

export default structure

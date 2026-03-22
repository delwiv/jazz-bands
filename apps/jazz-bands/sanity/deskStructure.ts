import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('CMS Jazz Bands')
    .items([
      S.listItem()
        .title('Groupes')
        .child(
          S.documentTypeList('band')
            .title('Groupes')
        ),
      S.listItem()
        .title('Musiciens')
        .child(
          S.documentTypeList('musician')
            .title('Musiciens')
        ),
    ])

export default structure

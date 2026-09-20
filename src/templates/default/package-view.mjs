export function defaultPackageView(packageData) {
  return { title: packageData.title, notes: packageData.lessonNotes ?? [], activities: packageData.activities ?? [] };
}

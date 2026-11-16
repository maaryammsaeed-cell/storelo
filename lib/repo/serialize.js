// lean() ka doc → UI-friendly object
export function toDTO(doc) {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}
export function toDTOs(docs) {
  return docs.map(toDTO);
}
export function findActiveSectionId(sections, scrollY, offset = 96) {
  let activeId = sections[0]?.id ?? null;
  for (const s of sections) {
    if (s.top - offset <= scrollY) activeId = s.id;
  }
  return activeId;
}

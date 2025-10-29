// Static lookups for school levels and regions from the SMS database
// These tables are not imported via FDW, so we maintain static copies

export interface SchoolLevel {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
}

export const SCHOOL_LEVELS: SchoolLevel[] = [
  { id: "0f7d4121-da54-4e4b-a7cc-def1f3958c85", name: "Special Education Needs" },
  { id: "139e4db2-d0ad-4465-addc-d3936283f981", name: "Nursery" },
  { id: "9f185585-14dc-4c8c-bafc-11ee977c2a28", name: "Secondary" },
  { id: "b554ef05-f6ea-4051-ae7f-7abb85a39aee", name: "Practical Instruction Centre" },
  { id: "b7f405e4-c9d7-4624-a89e-bbd675570027", name: "Primary" },
  { id: "cbbcdcbd-7183-4234-a951-2e3e0c2bdd63", name: "Post Secondary" },
];

export const REGIONS: Region[] = [
  { id: "550086ad-ceb8-4dc7-90fc-90cb3a7ad8ca", name: "Region 1" },
  { id: "dd62b8a3-e1cc-4f6e-8280-67a0fb137b84", name: "Region 2" },
  { id: "412bf3bd-290f-4136-a4cc-873b5eb0bb86", name: "Region 3" },
  { id: "c07c14dc-c2f0-4ec2-aac7-3cb826756dd1", name: "Region 4" },
  { id: "584cf543-ea8f-4afe-a24e-b688c3c922ab", name: "Region 5" },
  { id: "da05c68d-1781-4598-9840-810847658d4f", name: "Region 6" },
  { id: "fbd65418-4bc8-4c4b-b5ca-bc597504f938", name: "Region 7" },
  { id: "c3680862-9b97-419a-94f4-2e3403888d00", name: "Region 8" },
  { id: "58b8d4a8-7530-433c-bc16-832ee5a70f0a", name: "Region 9" },
  { id: "a371ab84-1d39-4547-b558-a2821d543a18", name: "Region 10" },
  { id: "b0bb1da7-2ab4-4181-aeff-d273f7f1c282", name: "Georgetown" },
];

// Helper functions to get names by ID
export function getSchoolLevelName(id: string): string | null {
  return SCHOOL_LEVELS.find(level => level.id === id)?.name || null;
}

export function getRegionName(id: string): string | null {
  return REGIONS.find(region => region.id === id)?.name || null;
}

// Create lookup maps for efficient access
export const SCHOOL_LEVEL_MAP = new Map(
  SCHOOL_LEVELS.map(level => [level.id, level.name])
);

export const REGION_MAP = new Map(
  REGIONS.map(region => [region.id, region.name])
);

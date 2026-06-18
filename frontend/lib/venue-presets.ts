import {
  AI_CAMPUS_LOCATION,
  AI_CAMPUS_NAME,
  DT_PLAYHOUSE_LOCATION,
  DT_PLAYHOUSE_NAME,
  I_HUB_LOCATION,
  COLLEGE_NAME,
  MECH_DEPT_LOCATION,
  MECH_DEPT_NAME,
  SNS_COLLEGE_OF_TECHNOLOGY_LOCATION,
  SNS_COLLEGE_OF_TECHNOLOGY_NAME,
  SNS_LAWN_LOCATION,
  SNS_LAWN_NAME,
  SPINE_CENTER_LOCATION,
  SPINE_CENTER_NAME,
  CSE_DEPT_LOCATION,
  CSE_DEPT_NAME,
} from "@/lib/college-location";

export type VenuePreset = {
  label: string;
  value: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  aliases: string[];
};

export const venuePresets: VenuePreset[] = [
  {
    label: COLLEGE_NAME,
    value: COLLEGE_NAME,
    address: COLLEGE_NAME,
    city: "Coimbatore",
    latitude: I_HUB_LOCATION.latitude,
    longitude: I_HUB_LOCATION.longitude,
    aliases: ["ih", "ihub", "snsn", "hub"],
  },
  {
    label: AI_CAMPUS_NAME,
    value: AI_CAMPUS_NAME,
    address: AI_CAMPUS_NAME,
    city: "Coimbatore",
    latitude: AI_CAMPUS_LOCATION.latitude,
    longitude: AI_CAMPUS_LOCATION.longitude,
    aliases: ["ai", "campus"],
  },
  {
    label: SPINE_CENTER_NAME,
    value: SPINE_CENTER_NAME,
    address: SPINE_CENTER_NAME,
    city: "Coimbatore",
    latitude: SPINE_CENTER_LOCATION.latitude,
    longitude: SPINE_CENTER_LOCATION.longitude,
    aliases: ["spine"],
  },
  {
    label: DT_PLAYHOUSE_NAME,
    value: DT_PLAYHOUSE_NAME,
    address: DT_PLAYHOUSE_NAME,
    city: "Coimbatore",
    latitude: DT_PLAYHOUSE_LOCATION.latitude,
    longitude: DT_PLAYHOUSE_LOCATION.longitude,
    aliases: ["dt", "playhouse"],
  },
  {
    label: SNS_LAWN_NAME,
    value: SNS_LAWN_NAME,
    address: SNS_LAWN_NAME,
    city: "Coimbatore",
    latitude: SNS_LAWN_LOCATION.latitude,
    longitude: SNS_LAWN_LOCATION.longitude,
    aliases: ["lawn"],
  },
  {
    label: MECH_DEPT_NAME,
    value: MECH_DEPT_NAME,
    address: MECH_DEPT_NAME,
    city: "Coimbatore",
    latitude: MECH_DEPT_LOCATION.latitude,
    longitude: MECH_DEPT_LOCATION.longitude,
    aliases: ["mech", "mechanical"],
  },
  {
    label: CSE_DEPT_NAME,
    value: CSE_DEPT_NAME,
    address: CSE_DEPT_NAME,
    city: "Coimbatore",
    latitude: CSE_DEPT_LOCATION.latitude,
    longitude: CSE_DEPT_LOCATION.longitude,
    aliases: ["cse", "computer science"],
  },
  {
    label: SNS_COLLEGE_OF_TECHNOLOGY_NAME,
    value: SNS_COLLEGE_OF_TECHNOLOGY_NAME,
    address: SNS_COLLEGE_OF_TECHNOLOGY_NAME,
    city: "Coimbatore",
    latitude: SNS_COLLEGE_OF_TECHNOLOGY_LOCATION.latitude,
    longitude: SNS_COLLEGE_OF_TECHNOLOGY_LOCATION.longitude,
    aliases: ["tech", "college of technology"],
  },
];

export function findVenuePreset(input: string) {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    venuePresets.find((venue) => {
      const haystacks = [venue.value, venue.label, ...venue.aliases].map((value) =>
        value.toLowerCase(),
      );
      return haystacks.some((item) => item.includes(normalized));
    }) ?? null
  );
}

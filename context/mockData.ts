export const mokedScannedDevices = [
  { id: "1", name: "Machine-Alpha" },
  { id: "2", name: "Machine-Beta" },
  { id: "3", name: "Machine-Gamma" },
  { id: "4", name: "Endo Cutter" },
]

const parts = ["Motor", "Pump", "Valve", "Gearbox"];

const endoCutterParts = [
  "anvil_jaw",
  "anvil_release_button",
  "articulation_field_rotating_knob",
  "articulation_joint",
  "reload_alignment_slot",
  "reload_cartridge_jaw"
];

export const getRandomParts = (deviceName: string) => {
  switch (deviceName) {
    case 'Endo Cutter':
      return endoCutterParts[Math.floor(Math.random() * endoCutterParts.length)];
    default:
      return parts[Math.floor(Math.random() * parts.length)];
  }
}
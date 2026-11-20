/**
 * Points clés des photos de pulls détourées (coordonnées 0–1 dans l'image).
 * « L » = côté gauche de l'IMAGE. Servent à déformer la photo sur le corps.
 */
export type KP = [number, number];
export type SleeveKP = { elbowOut: KP; elbowIn: KP; cuffOut: KP; cuffIn: KP };
export type GarmentKP = {
  neckL: KP;
  neckR: KP;
  /** haut du col roulé (optionnel) */
  collarL?: KP;
  collarR?: KP;
  shL: KP;
  shR: KP;
  pitL: KP;
  pitR: KP;
  hemL: KP;
  hemR: KP;
  sleeveL: SleeveKP;
  sleeveR: SleeveKP;
};

/** description (en anglais) envoyée au modèle d'essayage IA */
export type Garment = { src: string; kp: GarmentKP; credit: string; description: string };

export const garments = {
  blanc: {
    src: "/produits/pull-blanc.png",
    description: "crew neck long sleeve knitted sweater",
    credit: "« Jumper altered » — Preslethe, Wikimedia Commons, CC BY-SA 3.0",
    kp: {
      neckL: [0.36, 0.03],
      neckR: [0.58, 0.03],
      shL: [0.08, 0.12],
      shR: [0.88, 0.15],
      pitL: [0.2, 0.42],
      pitR: [0.74, 0.44],
      hemL: [0.2, 0.98],
      hemR: [0.72, 0.98],
      sleeveL: { elbowOut: [0.06, 0.52], elbowIn: [0.19, 0.42], cuffOut: [0.3, 0.74], cuffIn: [0.38, 0.64] },
      sleeveR: { elbowOut: [0.99, 0.47], elbowIn: [0.8, 0.47], cuffOut: [0.86, 0.77], cuffIn: [0.77, 0.7] },
    },
  },
  colV: {
    src: "/produits/col-v.png",
    description: "v-neck ribbed long sleeve knitted wool sweater",
    credit: "« Pullover (AM 1982.276-1) » — Auckland Museum, Wikimedia Commons, CC BY 4.0",
    kp: {
      neckL: [0.34, 0.02],
      neckR: [0.66, 0.02],
      shL: [0.17, 0.13],
      shR: [0.82, 0.15],
      pitL: [0.26, 0.36],
      pitR: [0.75, 0.4],
      hemL: [0.3, 0.86],
      hemR: [0.7, 0.84],
      sleeveL: { elbowOut: [0.06, 0.6], elbowIn: [0.24, 0.62], cuffOut: [0.04, 0.96], cuffIn: [0.24, 0.98] },
      sleeveR: { elbowOut: [0.93, 0.6], elbowIn: [0.76, 0.62], cuffOut: [0.96, 0.95], cuffIn: [0.8, 0.97] },
    },
  },
  colRoule: {
    src: "/produits/col-roule.png",
    description: "turtleneck long sleeve chunky knitted wool sweater",
    credit: "« Jersei coll alt » — Joan Rocaguinard, Wikimedia Commons, CC BY-SA 3.0",
    kp: {
      collarL: [0.36, 0.02],
      collarR: [0.64, 0.02],
      neckL: [0.33, 0.11],
      neckR: [0.68, 0.11],
      shL: [0.1, 0.21],
      shR: [0.9, 0.21],
      pitL: [0.24, 0.36],
      pitR: [0.78, 0.36],
      hemL: [0.2, 0.93],
      hemR: [0.8, 0.93],
      sleeveL: { elbowOut: [0.05, 0.58], elbowIn: [0.21, 0.58], cuffOut: [0.16, 0.97], cuffIn: [0.32, 0.97] },
      sleeveR: { elbowOut: [0.95, 0.58], elbowIn: [0.8, 0.58], cuffOut: [0.86, 0.98], cuffIn: [0.76, 0.95] },
    },
  },
} satisfies Record<string, Garment>;

export type GarmentId = keyof typeof garments;

CREATE TABLE IF NOT EXISTS contacts (
  id              SERIAL PRIMARY KEY,
  adresse         TEXT,
  cd              TEXT,
  cible           TEXT,
  cp              TEXT,
  date_cd         TEXT,
  departement     TEXT,
  departement_label TEXT,
  envoi_mail      TEXT,
  legacy_id       TEXT,
  mail            TEXT,
  mail2           TEXT,
  mail3           TEXT,
  mois_contact    TEXT,
  mois_envoi      TEXT,
  nom             TEXT,
  notes           TEXT,
  responsable     TEXT,
  responsable2    TEXT,
  responsable3    TEXT,
  tel_perso       TEXT,
  tel_pro         TEXT,
  tel3            TEXT,
  ville           TEXT,
  vu_le           TEXT,
  site            TEXT,
  send_mail_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_mail ON contacts (mail);
CREATE INDEX IF NOT EXISTS idx_contacts_departement ON contacts (departement);
CREATE INDEX IF NOT EXISTS idx_contacts_mois_contact ON contacts (mois_contact);

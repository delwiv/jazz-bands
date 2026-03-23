function getEnv() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env
  }
  return {}
}

const env = getEnv()

export function getAudioCdnUrl(audioRef: string): string {
  const projectId =
    env.VITE_SANITY_STUDIO_PROJECT_ID ||
    env.VITE_SANITY_PROJECT_ID ||
    env.SANITY_STUDIO_PROJECT_ID ||
    env.SANITY_PROJECT_ID
  const dataset =
    env.VITE_SANITY_STUDIO_DATASET ||
    env.VITE_SANITY_DATASET ||
    env.SANITY_STUDIO_DATASET ||
    env.SANITY_DATASET
  return `https://cdn.sanity.io/${projectId || ''}/${dataset || ''}/${audioRef}.mp3`
}

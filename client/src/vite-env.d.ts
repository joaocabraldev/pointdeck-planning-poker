/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_VOTE_VALUES?: string;
  readonly VITE_VOTING_STATUSES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

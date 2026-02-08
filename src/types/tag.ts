export type Tag = {
  id: string;
  label: string;
  description: string
  priority: number;
};

export type    TagState = {
  tags: Tag[],
  setTags:(t:Tag[])=>void
  loading: boolean
  setLoading: (l:boolean)=>void
  error: string
  setError: (err: string | Error | unknown) => void
}
-- Fotos e vídeos que o personal anexa aos exercícios da ficha.
-- Pode rodar de novo sem erro (tudo é "se não existir" / "apaga e recria").
--
-- Os arquivos ficam no bucket público "treinos": qualquer um com o link vê
-- (o aluno precisa abrir no app), mas só a equipe (dono e personal) envia e apaga.
-- O nome de cada arquivo é aleatório, então ninguém adivinha os links.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'treinos', 'treinos', true,
  52428800, -- 50 MB por arquivo (limite do plano grátis do Supabase)
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "midias de treino: equipe envia" on storage.objects;
create policy "midias de treino: equipe envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'treinos' and (select public.eh_equipe()));

drop policy if exists "midias de treino: equipe troca" on storage.objects;
create policy "midias de treino: equipe troca" on storage.objects
  for update to authenticated
  using (bucket_id = 'treinos' and (select public.eh_equipe()));

drop policy if exists "midias de treino: equipe apaga" on storage.objects;
create policy "midias de treino: equipe apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'treinos' and (select public.eh_equipe()));

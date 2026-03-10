insert into public.roles (name, category, sort_order)
values
  ('Responsable', 'Coordinacion', 10),
  ('Realizador', 'Produccion', 20),
  ('Operador de Control', 'Produccion', 30),
  ('Operador de Grafica', 'Produccion', 35),
  ('Soporte tecnico', 'Produccion', 40),
  ('Productor', 'Produccion', 50),
  ('Relator', 'Talento', 60),
  ('Comentario 1', 'Talento', 70),
  ('Comentario 2', 'Talento', 80),
  ('Campo', 'Talento', 90),
  ('Encoder', 'Transmision', 100),
  ('Ingenieria', 'Transmision', 110),
  ('Camara 1', 'Camaras', 120),
  ('Camara 2', 'Camaras', 130),
  ('Camara 3', 'Camaras', 140),
  ('Camara 4', 'Camaras', 150),
  ('Camara 5', 'Camaras', 160)
on conflict (name) do update set
  category = excluded.category,
  sort_order = excluded.sort_order,
  active = true;

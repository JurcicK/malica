insert into public.users (username, password, full_name, role, department, active)
values
  ('admin', 'admin', 'Kristjan Jurcic', 'admin', 'Administracija', true),
  ('marko', 'malica', 'Marko Novak', 'employee', 'Skladišče', true),
  ('nina', 'malica', 'Nina Kralj', 'employee', 'Prodaja', true),
  ('tina', 'malica', 'Tina Zupan', 'employee', 'Računovodstvo', true),
  ('rok', 'malica', 'Rok Mlakar', 'employee', 'Servis', true)
on conflict (username) do update
set
  password = excluded.password,
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  active = excluded.active;

update public.weekly_offers
set is_active = false;

with inserted_offer as (
  insert into public.weekly_offers (
    week_label,
    source_label,
    cutoff_hour,
    starts_on,
    ends_on,
    is_active
  )
  values (
    '{"sl":"Tedenska ponudba 31. 3. - 4. 4. 2026","en":"Weekly offer March 31 - April 4, 2026","uk":"Тижнева пропозиція 31.03 - 04.04.2026"}'::jsonb,
    '{"sl":"Ročni začetni seed","en":"Manual initial seed","uk":"Початковий ручний seed"}'::jsonb,
    10,
    '2026-03-31',
    '2026-04-04',
    true
  )
  returning id
)
insert into public.meal_items (
  offer_id,
  service_date,
  category,
  title,
  description,
  allergens,
  is_always_available,
  sort_order
)
select
  inserted_offer.id,
  meals.service_date,
  meals.category,
  meals.title::jsonb,
  meals.description::jsonb,
  meals.allergens,
  meals.is_always_available,
  meals.sort_order
from inserted_offer
cross join (
  values
    ('2026-03-31'::date, 'bodi fit', '{"sl":"Piščančji zrezek capresse, čičerikin humus in lečina solata po mediteransko","en":"Chicken caprese steak, chickpea hummus and Mediterranean lentil salad","uk":"Курячий стейк капрезе, хумус із нуту та середземноморський салат із сочевиці"}', null, '1, 2, 3', false, 1),
    ('2026-03-31'::date, 'vege', '{"sl":"Testenine v omaki štirih sirov","en":"Pasta in four-cheese sauce","uk":"Паста в соусі з чотирьох сирів"}', null, '1, 2, 3', false, 2),
    ('2026-03-31'::date, 'ali pa..', '{"sl":"Kmečki krožnik s pečenico, prekajenim mesom, svinjsko pečenko, zeljem in praženim krompirjem","en":"Farmer''s plate with sausage, smoked meat, roast pork, cabbage and sauteed potatoes","uk":"Селянська тарілка з ковбасою, копченим м’ясом, печеною свининою, капустою та смаженою картоплею"}', null, '1', false, 3),
    ('2026-03-31'::date, 'na hitro...', '{"sl":"Telečja obara s čemaževimi vodnimi žličniki","en":"Veal stew with wild garlic dumplings","uk":"Теляча юшка з кнедликами з черемшею"}', null, '1, 2, 3', false, 4),
    ('2026-04-01'::date, 'bodi fit', '{"sl":"Cubisov krožnik z grško solato, piščancem, tzatzikijem in krompirčkom","en":"Cubis plate with Greek salad, chicken, tzatziki and fries","uk":"Тарілка Cubis з грецьким салатом, куркою, дзадзикі та картоплею фрі"}', null, '1, 2, 3', false, 1),
    ('2026-04-01'::date, 'vege', '{"sl":"Yaki udon rezanci s tofujem, romaneskom, šitake gobami, bučkami in sezamom","en":"Yaki udon noodles with tofu, romanesco, shiitake mushrooms, zucchini and sesame","uk":"Локшина які удон з тофу, романеско, грибами шиїтаке, цукіні та кунжутом"}', null, '1, 2, 7, 8, 9, 10, 11, 12', false, 2),
    ('2026-04-01'::date, 'ali pa..', '{"sl":"Svinjski kotlet po milansko, žafranova rižota in kremni grah","en":"Milan-style pork cutlet with saffron risotto and creamed peas","uk":"Свиняча відбивна по-міланськи з шафрановим різото та вершковим горошком"}', null, '1, 2, 3', false, 3),
    ('2026-04-01'::date, 'na hitro...', '{"sl":"Čufte v kremni smetanovi omaki s pire krompirjem","en":"Meatballs in creamy sauce with mashed potatoes","uk":"Тефтелі у вершковому соусі з картопляним пюре"}', null, '3', false, 4),
    ('2026-04-02'::date, 'bodi fit', '{"sl":"Svinjski zrezek z lisičkovo omako, pečena polenta z rukolo in parmezanom","en":"Pork steak with chanterelle sauce, baked polenta, arugula and parmesan","uk":"Свинячий стейк із соусом з лисичок, запеченою полентою, руколою та пармезаном"}', null, '3', false, 1),
    ('2026-04-02'::date, 'vege', '{"sl":"Ocvrti sir, pomfri in domača tatarska omaka","en":"Fried cheese, fries and homemade tartar sauce","uk":"Смажений сир, картопля фрі та домашній соус тартар"}', null, '1, 2, 3', false, 2),
    ('2026-04-02'::date, 'ali pa..', '{"sl":"Piščančji medaljoni v nacho omaki z mehiškim rižem","en":"Chicken medallions in nacho sauce with Mexican rice","uk":"Курячі медальйони в соусі начо з мексиканським рисом"}', null, '1, 2, 3', false, 3),
    ('2026-04-02'::date, 'na hitro...', '{"sl":"Testenine s pršutom in šparglji","en":"Pasta with prosciutto and asparagus","uk":"Паста з прошуто та спаржею"}', null, '1, 2, 3', false, 4),
    (null, 'stalna ponudba', '{"sl":"Dunajski zrezek z ocvrtim krompirjem","en":"Vienna schnitzel with fried potatoes","uk":"Віденський шніцель зі смаженою картоплею"}', null, null, true, 100),
    (null, 'stalna ponudba', '{"sl":"Ocvrti sir z ocvrtim krompirjem in tatarsko omako","en":"Fried cheese with fried potatoes and tartar sauce","uk":"Смажений сир зі смаженою картоплею та соусом тартар"}', null, null, true, 101),
    (null, 'stalna ponudba', '{"sl":"Solatni krožnik s pečeno zelenjavo in izbiro dodatka","en":"Salad plate with roasted vegetables and topping choice","uk":"Салатна тарілка із запеченими овочами та вибором додатка"}', '{"sl":"mocarela, šunka/sir, pečen piščanec ali tuna","en":"mozzarella, ham/cheese, roasted chicken or tuna","uk":"моцарела, шинка/сир, запечена курка або тунець"}', null, true, 102)
) as meals(service_date, category, title, description, allergens, is_always_available, sort_order);

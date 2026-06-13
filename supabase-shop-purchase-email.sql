begin;

update public.shop_items
set
  summary = regexp_replace(summary, 'simon_j_brookes@icloud\.com', 'purchase@theshipsshop.com', 'gi'),
  description = regexp_replace(description, 'simon_j_brookes@icloud\.com', 'purchase@theshipsshop.com', 'gi'),
  production_note = regexp_replace(production_note, 'simon_j_brookes@icloud\.com', 'purchase@theshipsshop.com', 'gi'),
  price_note = regexp_replace(price_note, 'simon_j_brookes@icloud\.com', 'purchase@theshipsshop.com', 'gi'),
  request_subject = regexp_replace(request_subject, 'simon_j_brookes@icloud\.com', 'purchase@theshipsshop.com', 'gi'),
  request_intro = regexp_replace(request_intro, 'simon_j_brookes@icloud\.com', 'purchase@theshipsshop.com', 'gi'),
  updated_at = now()
where concat_ws(
  ' ',
  summary,
  description,
  production_note,
  price_note,
  request_subject,
  request_intro
) ~* 'simon_j_brookes@icloud\.com';

commit;

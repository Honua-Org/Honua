-- Insert test traffic sources data for seller ID 9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57

INSERT INTO traffic_sources (seller_id, source, medium, campaign, date, visits, unique_visitors)
VALUES 
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'google', 'organic', null, CURRENT_DATE - INTERVAL '1 day', 150, 120),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'facebook', 'social', 'summer_sale', CURRENT_DATE - INTERVAL '2 days', 85, 70),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'instagram', 'social', 'product_showcase', CURRENT_DATE - INTERVAL '3 days', 95, 80),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'direct', null, null, CURRENT_DATE - INTERVAL '4 days', 200, 180),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'email', 'newsletter', 'weekly_digest', CURRENT_DATE - INTERVAL '5 days', 45, 40),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'twitter', 'social', 'brand_awareness', CURRENT_DATE - INTERVAL '6 days', 30, 25),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'youtube', 'video', 'product_demo', CURRENT_DATE - INTERVAL '7 days', 65, 55),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'google', 'cpc', 'paid_search', CURRENT_DATE - INTERVAL '8 days', 120, 100),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'referral', 'website', null, CURRENT_DATE - INTERVAL '9 days', 25, 22),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', 'linkedin', 'social', 'b2b_campaign', CURRENT_DATE - INTERVAL '10 days', 40, 35);
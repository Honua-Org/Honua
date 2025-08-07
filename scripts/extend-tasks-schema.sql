-- Extend sustainability_tasks table to support different task types
-- Add new columns for task type, requirements, and verification methods

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'sustainability' CHECK (task_type IN ('sustainability', 'social_media', 'blockchain', 'community', 'educational'));

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'::jsonb;

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) DEFAULT 'manual' CHECK (verification_method IN ('manual', 'automatic', 'social_verification', 'blockchain_verification', 'url_verification'));

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS external_url TEXT;

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS social_platform VARCHAR(50);

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS blockchain_network VARCHAR(50);

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS contract_address TEXT;

ALTER TABLE sustainability_tasks 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing tasks to have the new task_type
UPDATE sustainability_tasks 
SET task_type = 'sustainability' 
WHERE task_type IS NULL;

-- Insert sample social media tasks
INSERT INTO sustainability_tasks (
  title, description, category, difficulty, points, impact_score, 
  verification_required, task_type, verification_method, external_url, 
  social_platform, requirements
) VALUES 
(
  'Follow Honua on X (Twitter)', 
  'Follow our official X (Twitter) account to stay updated with sustainability news and tips', 
  'Social Media', 
  'easy', 
  5, 
  10, 
  true, 
  'social_media', 
  'social_verification', 
  'https://twitter.com/honuasocial', 
  'twitter', 
  '{"action": "follow", "account": "@honuasocial"}'
),
(
  'Like Our Latest Instagram Post', 
  'Like our latest sustainability post on Instagram to show your support', 
  'Social Media', 
  'easy', 
  3, 
  5, 
  true, 
  'social_media', 
  'social_verification', 
  'https://instagram.com/honuasocial', 
  'instagram', 
  '{"action": "like", "post_type": "latest"}'
),
(
  'Share Our LinkedIn Article', 
  'Share our latest sustainability article on LinkedIn with your network', 
  'Social Media', 
  'medium', 
  10, 
  15, 
  true, 
  'social_media', 
  'social_verification', 
  'https://linkedin.com/company/honuasocial', 
  'linkedin', 
  '{"action": "share", "content_type": "article"}'
),
(
  'Visit Our Sustainability Blog', 
  'Visit and spend at least 2 minutes reading our sustainability blog', 
  'Educational', 
  'easy', 
  5, 
  8, 
  false, 
  'educational', 
  'url_verification', 
  'https://blog.honuasocial.com', 
  null, 
  '{"min_time": 120, "action": "visit_and_read"}'
)
ON CONFLICT (title) DO NOTHING;

-- Insert sample blockchain tasks
INSERT INTO sustainability_tasks (
  title, description, category, difficulty, points, impact_score, 
  verification_required, task_type, verification_method, blockchain_network, 
  contract_address, requirements
) VALUES 
(
  'Mint Carbon Credit NFT', 
  'Mint a carbon credit NFT to offset your carbon footprint on the blockchain', 
  'Blockchain', 
  'medium', 
  50, 
  75, 
  true, 
  'blockchain', 
  'blockchain_verification', 
  'ethereum', 
  '0x1234567890abcdef1234567890abcdef12345678', 
  '{"action": "mint", "token_type": "carbon_credit", "min_amount": 1}'
),
(
  'Stake in Green Energy Pool', 
  'Stake tokens in a verified green energy investment pool', 
  'Blockchain', 
  'hard', 
  100, 
  150, 
  true, 
  'blockchain', 
  'blockchain_verification', 
  'polygon', 
  '0xabcdef1234567890abcdef1234567890abcdef12', 
  '{"action": "stake", "pool_type": "green_energy", "min_amount": 100}'
),
(
  'Vote on Climate Proposal', 
  'Participate in DAO governance by voting on a climate-related proposal', 
  'Blockchain', 
  'medium', 
  30, 
  40, 
  true, 
  'blockchain', 
  'blockchain_verification', 
  'ethereum', 
  '0x9876543210fedcba9876543210fedcba98765432', 
  '{"action": "vote", "proposal_type": "climate", "participation_required": true}'
)
ON CONFLICT (title) DO NOTHING;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sustainability_tasks_task_type ON sustainability_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_sustainability_tasks_verification_method ON sustainability_tasks(verification_method);
CREATE INDEX IF NOT EXISTS idx_sustainability_tasks_social_platform ON sustainability_tasks(social_platform);
CREATE INDEX IF NOT EXISTS idx_sustainability_tasks_blockchain_network ON sustainability_tasks(blockchain_network);
CREATE INDEX IF NOT EXISTS idx_sustainability_tasks_is_active ON sustainability_tasks(is_active);

-- Update user_task_completions to support new verification data
ALTER TABLE user_task_completions 
ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_task_completions 
ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

ALTER TABLE user_task_completions 
ADD COLUMN IF NOT EXISTS social_proof_url TEXT;

-- Create index for verification data
CREATE INDEX IF NOT EXISTS idx_user_task_completions_verification_data ON user_task_completions USING GIN(verification_data);
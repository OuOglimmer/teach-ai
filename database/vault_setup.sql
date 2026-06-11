-- ========================================
-- Supabase Vault 配置 - DeepSeek API Key
-- ========================================
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 启用 Vault 扩展（如未启用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 2. 创建安全函数：获取 DeepSeek API Key（仅此一个用途）
CREATE OR REPLACE FUNCTION public.get_deepseek_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_key TEXT;
BEGIN
    SELECT decrypted_secret::TEXT INTO api_key
    FROM vault.decrypted_secrets
    WHERE name = 'teach-ai-key'
    LIMIT 1;
    RETURN api_key;
END;
$$;

-- 3. 创建/更新密钥的 RPC
CREATE OR REPLACE FUNCTION vault_upsert_secret(p_name text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE name = p_name;
  INSERT INTO vault.secrets (name, secret)
  VALUES (p_name, p_value);
END;
$$;

-- 4. 授予权限
GRANT EXECUTE ON FUNCTION public.get_deepseek_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION vault_upsert_secret TO authenticated, anon;

-- ========================================
-- 手动添加密钥到 Vault：
-- Supabase Dashboard > Project > Vault > Add Secret
-- Name: teach-ai-key
-- Value: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- ========================================

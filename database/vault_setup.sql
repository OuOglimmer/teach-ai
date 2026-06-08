-- ========================================
-- Supabase Vault 配置 - DeepSeek API Key
-- ========================================
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 启用 Vault 扩展（如未启用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 2. 获取密钥的 RPC
CREATE OR REPLACE FUNCTION vault_get_secret(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value text;
BEGIN
  SELECT decrypted_secret::text INTO v_value
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
  RETURN v_value;
END;
$$;

-- 3. 创建/更新密钥的 RPC
CREATE OR REPLACE FUNCTION vault_upsert_secret(p_name text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除已有同名密钥
  DELETE FROM vault.secrets WHERE name = p_name;
  -- 插入新密钥
  INSERT INTO vault.secrets (name, secret)
  VALUES (p_name, p_value);
END;
$$;

-- 4. 授予权限
GRANT EXECUTE ON FUNCTION vault_get_secret TO authenticated;
GRANT EXECUTE ON FUNCTION vault_upsert_secret TO authenticated, anon;

-- ========================================
-- 可选：直接通过 Dashboard 手动添加密钥
-- Supabase Dashboard > Project > Vault > Add Secret
-- Name: deepseek_api_key
-- Value: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- ========================================

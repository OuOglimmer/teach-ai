AI 教学工作台

基于 Vue 3 + TypeScript + Vite 8 构建的智慧教育管理系统，集成 DeepSeek 大模型实现 AI 智能教学辅助，支持一键切换 Mock / 真实后端，具备完整的用户角色隔离与教育业务功能。

技术选型

  类别   	技术                                      
  前端框架 	Vue 3 (Composition API + <script setup>)
  语言   	TypeScript 6 (strict)                   
  构建   	Vite 8                                  
  状态管理 	Pinia 3                                 
  路由   	vue-router 4                            
  样式   	Tailwind CSS 4                          
  后端平台 	Supabase (Auth + PostgreSQL + RLS + Vault)
  AI 模型	DeepSeek Chat API (deepseek-chat)       
  类型检查 	vue-tsc 3                               

核心特性

AI 智能引擎

- 流式对话：SSE 逐 token 推送，实时打字机效果
- 角色感知提示词：学生/教师/管理员自动切换系统提示词
- 多源 API Key：Supabase Vault → 环境变量 → 用户手动输入，三级降级
- 预算管控：月度用量追踪，$5 默认上限，超限自动禁用
- 速率限制：每分钟 30 次，防滥用
- Mock 模式：7 类学科关键词回复库，无 Key 自动降级
- 文件解析：txt/md/pdf/docx/图片/代码上传，自动附带到对话上下文
- 对话持久化：完整对话历史存储，支持回顾、继续、搜索与删除

权限与路由

- 三角色体系：管理员 / 教师 / 学生，路由级权限隔离
- 动态侧边栏：根据角色自动过滤菜单项
- 注册审批流：教师/管理员注册需管理员审核

Mock / 真实后端一键切换

- VITE_USE_REAL_SUPABASE=true → 连接真实 Supabase
- VITE_USE_REAL_SUPABASE=false → 全内存 Mock，三组内置测试账号

教育业务

- 班级管理（CRUD，学生/教师关联）
- 考试管理（发布、打分、成绩排名）
- 作业发布与提交批改
- 学习建议与个性化练习（AI 驱动）
- 教学资源库
- 班级统计看板

AI 解题流程

    用户输入问题/文件
           │
           ▼
      AiQA.vue ── 加载历史对话 ── supabase.ai_conversations
           │
           ▼
      deepseek.ts
      ├─ 检查服务禁用状态     → localStorage
      ├─ 检查月度预算         → localStorage (默认 $5)
      ├─ 检查速率限制         → 30次/分钟
      ├─ 获取 API Key:       → Vault → env → Mock
      └─ 发起 AI 请求:
           │
           ├── 有 Key ──→ fetch(api.deepseek.com) stream:true
           │                ├─ SSE 解析 → onToken(token)
           │                └─ 实时更新 UI（打字机效果）
           │
           └── 无 Key ──→ Mock 模式
                            ├─ 关键词匹配（二次函数/牛顿/时态...）
                            └─ 逐字模拟输出 + 延迟
           │
           ▼
      onDone(fullContent)
      ├─ 保存 AI 回复到对话 → supabase
      └─ 记录 Token 用量与成本

项目结构

    src/
    ├── lib/
    │   ├── deepseek.ts       # DeepSeek AI 流式调用 + Mock 模式
    │   ├── api.ts            # API 层（Conversation CRUD、Vault 密钥）
    │   ├── supabase.ts       # Supabase 客户端 + 完整 Mock 实现
    │   ├── rate-limiter.ts   # API 速率限制
    │   └── usage-tracker.ts  # Token 用量统计与预算控制
    ├── pages/
    │   ├── auth/Login.vue
    │   ├── dashboard/
    │   ├── student/          # AI答疑、学习建议、个性化练习
    │   ├── teacher/          # 备课、考试、资源中心
    │   ├── exams/
    │   ├── analysis/         # 学情分析
    │   ├── history/          # AI 对话历史
    │   ├── management/       # 班级/学校管理
    │   ├── profile/
    │   └── usage/            # API 用量统计
    ├── stores/auth.ts        # 用户状态（角色感知驱动 AI 提示词）
    ├── router/index.ts       # 路由配置（角色隔离）
    ├── types/index.ts        # AiConversation、Message 等类型定义
    └── layouts/AppLayout.vue # 侧边栏导航
    
    database/
    ├── init.sql              # 完整建表 + 触发器 + RLS 策略
    ├── schema.sql            # 参考 Schema
    └── vault_setup.sql       # Supabase Vault 加密存储 AI Key

数据库 ER 图

    auth.users ──→ profiles (触发器自动创建)
    profiles ──→ ai_conversations (AI 对话记录)
    profiles ──→ learning_suggestions (AI 学习建议)
    profiles ──→ practice_exercises (AI 个性化练习)
    profiles ──→ exam_results
    profiles ──→ class_students / class_teachers
    classes ──→ exams / tests / homework / class_stats
    exams ──→ exam_results

快速开始

    # 安装依赖
    npm install
    
    # 开发模式（Mock 后端，无需任何配置）
    npm run dev
    
    # 或使用真实 Supabase 后端
    # 修改 .env 中 VITE_USE_REAL_SUPABASE=true
    # 并在 Supabase Dashboard 执行 database/init.sql 建表

内置演示账号（Mock 模式）

  角色  	邮箱              	密码    
  管理员 	admin@test.com  	123456
  教师  	teacher@test.com	123456
  学生  	student@test.com	123456

常用脚本

    npm run dev        # 启动开发服务器
    npm run build      # 类型检查 + 生产构建
    npm run preview    # 预览生产构建

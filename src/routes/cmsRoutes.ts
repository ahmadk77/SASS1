import express from 'express';
import { db } from '../db/index.ts';
import { pages, posts, clientWorkspaces, savedTemplates, auditLogs, templates, users, tenants, websites, websiteContent, notifications } from '../db/schema.ts';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { logger } from '../lib/logger.ts';
import { getSystemSettings } from '../lib/systemSettings.ts';
import { sendWelcomeEmail } from '../lib/sendAutomatedEmail.ts';

const router = express.Router();

// Helper to find or create user in DB
async function getOrCreateUser(uid: string, email: string) {
  const cleanEmail = email.toLowerCase().trim();
  let userList = await db.select().from(users).where(and(eq(users.uid, uid), isNull(users.deletedAt)));
  if (userList.length > 0) return userList[0];

  userList = await db.select().from(users).where(and(eq(users.email, cleanEmail), isNull(users.deletedAt)));
  if (userList.length > 0) return userList[0];

  const newUser = await db.insert(users).values({
    uid,
    email: cleanEmail,
    name: email.split('@')[0],
    role: 'user',
    status: 'active'
  }).returning();
  const createdUser = newUser[0];
  if (createdUser && createdUser.email) {
    sendWelcomeEmail(
      createdUser.email,
      createdUser.name || 'عميلنا العزيز',
      `${process.env.APP_URL || 'https://bunyan.website'}/dashboard`
    ).catch(e => console.error('Failed to send welcome email on first user creation:', e));

    db.insert(notifications).values({
      tenantId: null,
      targetEmail: createdUser.email.toLowerCase(),
      title: 'أهلاً وسهلاً بك في منصة بنيان! 🎉',
      message: `مرحباً بك يا ${createdUser.name || 'عميلنا العزيز'}! يسعدنا انضمامك إلى منصة بنيان، مساحتك الرقمية جاهزة ولوحة التحكم مجهزة لتطوير أعمالك وموقعك.`,
      isRequired: 1,
      isRead: 0
    }).catch(e => console.error('Failed to create in-app notification on first user creation:', e));
  }
  return createdUser;
}

// 1. User Ping
router.post('/api/user/ping', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    let targetUser = req.dbUser;

    if (!targetUser) {
      const email = req.user?.email ? req.user.email.toLowerCase().trim() : null;
      const uid = req.user?.uid;
      if (uid && email) {
        try {
          targetUser = await getOrCreateUser(uid, email);
        } catch (dbErr: any) {
          console.warn('Ping user lookup notice:', dbErr?.message || dbErr);
        }
      }
    }

    if (targetUser) {
      try {
        await db.update(users).set({
          lastActiveAt: new Date(),
          isOnline: 1
        }).where(eq(users.id, targetUser.id));
      } catch (dbErr: any) {
        console.warn('Ping update notice:', dbErr?.message || dbErr);
      }
    }

    res.json({ status: 'ok', lastActiveAt: new Date() });
  } catch (e: any) {
    logger.warn('Ping notice:', e?.message || e);
    res.json({ status: 'ok', warning: 'ping_degraded' });
  }
});

// Update Profile endpoint
router.put('/api/user/profile', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, avatarUrl } = req.body;
    let targetUser = req.dbUser;
    const uid = req.user?.uid;
    const email = req.user?.email ? req.user.email.toLowerCase().trim() : null;

    if (!targetUser && uid && email) {
      targetUser = await getOrCreateUser(uid, email);
    }

    if (targetUser) {
      const updatePayload: any = {};
      if (name !== undefined) updatePayload.name = name;
      if (avatarUrl !== undefined) updatePayload.avatarUrl = avatarUrl;
      
      if (Object.keys(updatePayload).length > 0) {
        await db.update(users).set(updatePayload).where(eq(users.id, targetUser.id));
      }
    }

    res.json({ status: 'ok', name, avatarUrl });
  } catch (e: any) {
    logger.error('Update user profile error:', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 2. User Status
router.get('/api/me/status', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.user || !req.user.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const email = req.user.email.toLowerCase().trim();
    const userList = await db.select().from(users).where(and(eq(users.email, email), isNull(users.deletedAt)));
    if (userList.length === 0) {
      res.json({ status: 'active', role: 'user', permissions: 'none', name: '', email, quizAnswers: null });
      return;
    }
    const dbUser = userList[0];
    res.json({ 
      status: dbUser.status,
      role: dbUser.role,
      permissions: dbUser.permissions,
      name: dbUser.name,
      email: dbUser.email,
      tenantId: dbUser.tenantId || null,
      quizAnswers: dbUser.quizAnswers || null
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 2b. Save User Quiz Answers
router.post('/api/user/quiz-answers', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, email, answers } = req.body;
    if (!answers) {
      res.status(400).json({ error: 'Missing answers' });
      return;
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    const uidStr = userId ? String(userId) : '';

    if (cleanEmail || uidStr) {
      let targetUserList = [];
      if (uidStr) {
        targetUserList = await db.select().from(users).where(and(eq(users.uid, uidStr), isNull(users.deletedAt)));
      }
      if (targetUserList.length === 0 && cleanEmail) {
        targetUserList = await db.select().from(users).where(and(eq(users.email, cleanEmail), isNull(users.deletedAt)));
      }

      if (targetUserList.length > 0) {
        await db.update(users).set({
          quizAnswers: answers
        }).where(eq(users.id, targetUserList[0].id));
      }
    }

    res.json({ success: true, answers });
  } catch (e: any) {
    logger.error('Error saving quiz answers:', e);
    res.status(500).json({ error: 'Failed to save quiz answers', details: e?.message });
  }
});

// 3. CMS Pages
router.get('/api/cms/pages', async (req: express.Request, res: express.Response) => {
  try {
    const allPages = await db.select().from(pages);
    res.json({ pages: allPages });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.post('/api/cms/pages', async (req: express.Request, res: express.Response) => {
  try {
    const { title, slug, content, seoTitle, seoDescription, seoKeywords, status, tenantId } = req.body;
    const tId = tenantId || 1;
    const inserted = await db.insert(pages).values({
      tenantId: tId,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      content: content || '',
      seoTitle,
      seoDescription,
      seoKeywords,
      status: status || 'published',
    }).returning();

    await db.insert(auditLogs).values({
      tenantId: tId,
      userId: 'admin_owner',
      action: 'CREATE',
      resourceType: 'pages',
      resourceId: String(inserted[0].id),
      changes: { title, slug: inserted[0].slug }
    });

    res.status(201).json({ page: inserted[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

router.put('/api/cms/pages/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, slug, content, seoTitle, seoDescription, seoKeywords, status } = req.body;
    const updated = await db.update(pages).set({
      title,
      slug,
      content: content || '',
      seoTitle,
      seoDescription,
      seoKeywords,
      status,
      updatedAt: new Date()
    }).where(eq(pages.id, id)).returning();

    if (updated.length > 0) {
      await db.insert(auditLogs).values({
        tenantId: updated[0]?.tenantId || null,
        userId: 'admin_owner',
        action: 'UPDATE',
        resourceType: 'pages',
        resourceId: String(id),
        changes: { title, slug, status }
      }).catch(() => {});
    }

    res.json({ page: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/api/cms/pages/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pageToDelete = await db.select().from(pages).where(eq(pages.id, id));
    await db.delete(pages).where(eq(pages.id, id));

    if (pageToDelete.length > 0) {
      await db.insert(auditLogs).values({
        tenantId: pageToDelete[0]?.tenantId || null,
        userId: 'admin_owner',
        action: 'DELETE',
        resourceType: 'pages',
        resourceId: String(id),
        changes: { title: pageToDelete[0]?.title }
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// 4. CMS Posts
router.get('/api/cms/posts', async (req: express.Request, res: express.Response) => {
  try {
    const allPosts = await db.select().from(posts);
    res.json({ posts: allPosts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/api/cms/posts', async (req: express.Request, res: express.Response) => {
  try {
    const { title, slug, content, excerpt, coverImage, authorName, seoTitle, seoDescription, seoKeywords, status, tenantId } = req.body;
    const tId = tenantId || 1;
    const inserted = await db.insert(posts).values({
      tenantId: tId,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      content: content || '',
      excerpt,
      coverImage,
      authorName,
      seoTitle,
      seoDescription,
      seoKeywords,
      status: status || 'published',
    }).returning();

    await db.insert(auditLogs).values({
      tenantId: tId,
      userId: authorName || 'admin_owner',
      action: 'CREATE',
      resourceType: 'posts',
      resourceId: String(inserted[0].id),
      changes: { title, slug: inserted[0].slug }
    });

    res.status(201).json({ post: inserted[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/api/cms/posts/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, slug, content, excerpt, coverImage, authorName, seoTitle, seoDescription, seoKeywords, status } = req.body;
    const updated = await db.update(posts).set({
      title,
      slug,
      content: content || '',
      excerpt,
      coverImage,
      authorName,
      seoTitle,
      seoDescription,
      seoKeywords,
      status,
      updatedAt: new Date()
    }).where(eq(posts.id, id)).returning();

    if (updated.length > 0) {
      await db.insert(auditLogs).values({
        tenantId: updated[0]?.tenantId || null,
        userId: authorName || 'admin_owner',
        action: 'UPDATE',
        resourceType: 'posts',
        resourceId: String(id),
        changes: { title, slug, status }
      }).catch(() => {});
    }

    res.json({ post: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/api/cms/posts/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const postToDelete = await db.select().from(posts).where(eq(posts.id, id));
    await db.delete(posts).where(eq(posts.id, id));

    if (postToDelete.length > 0) {
      await db.insert(auditLogs).values({
        tenantId: postToDelete[0]?.tenantId || null,
        userId: 'admin_owner',
        action: 'DELETE',
        resourceType: 'posts',
        resourceId: String(id),
        changes: { title: postToDelete[0]?.title }
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// 5. Workspaces
router.get('/api/workspaces', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.query.userId as string) || 'default_client';
    const userWorkspaces = await db.select().from(clientWorkspaces).where(eq(clientWorkspaces.userId, userId));
    res.json({ workspaces: userWorkspaces });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

router.get('/api/workspaces/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id > 2147483647 || id <= 0) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }
    const ws = await db.select().from(clientWorkspaces).where(eq(clientWorkspaces.id, id));
    if (!ws.length) return res.status(404).json({ error: 'Workspace not found' });
    res.json({ workspace: ws[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workspace', details: error.message });
  }
});

router.post('/api/workspaces', async (req: express.Request, res: express.Response) => {
  try {
    const sys = getSystemSettings();
    if (sys.lockSaveEdits) {
      return res.status(403).json({ error: sys.customNoticeMessage || 'مغلق الآن: حفظ التعديلات مغلق حالياً من قبل الإدارة' });
    }
    const { userId, templateId, name, customizations, settings, domain } = req.body;
    const inserted = await db.insert(clientWorkspaces).values({
      userId: userId || 'default_client',
      templateId: String(templateId || '1'),
      name: name || 'موقعي الجديد',
      domain: domain || `${templateId || 'site'}-${Date.now().toString().slice(-4)}.mysite.com`,
      customizations: customizations || {},
      settings: settings || {},
      status: 'draft',
    }).returning();

    res.status(201).json({ workspace: inserted[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create workspace', details: error.message });
  }
});

router.put('/api/workspaces/:id', async (req: express.Request, res: express.Response) => {
  try {
    const sys = getSystemSettings();
    if (sys.lockSaveEdits) {
      return res.status(403).json({ error: sys.customNoticeMessage || 'مغلق الآن: حفظ التعديلات مغلق حالياً من قبل الإدارة' });
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id > 2147483647 || id <= 0) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }
    const { name, customizations, settings, status, domain } = req.body;
    const updated = await db.update(clientWorkspaces).set({
      ...(name && { name }),
      ...(customizations && { customizations }),
      ...(settings && { settings }),
      ...(status && { status }),
      ...(domain && { domain }),
      updatedAt: new Date()
    }).where(eq(clientWorkspaces.id, id)).returning();

    const wsRecord = updated[0];
    if (wsRecord && customizations) {
      try {
        const userList = await db.select().from(users).where(eq(users.uid, wsRecord.userId));
        let dbUser = userList.length > 0 ? userList[0] : null;
        if (!dbUser) {
          const emailList = await db.select().from(users).where(eq(users.id, wsRecord.userId));
          dbUser = emailList.length > 0 ? emailList[0] : null;
        }
        if (dbUser) {
          let tenantList = await db.select().from(tenants).where(and(eq(tenants.userId, dbUser.id), isNull(tenants.deletedAt)));
          let tenant = tenantList.length > 0 ? tenantList[0] : null;
          if (!tenant) {
            const sub = (wsRecord.domain || dbUser.email?.split('@')[0] || 'site').replace(/[^a-z0-9]/gi, '').toLowerCase();
            const createdTenant = await db.insert(tenants).values({
              userId: dbUser.id,
              name: wsRecord.name || 'موقعي',
              subdomain: sub + Math.floor(Math.random() * 1000),
            }).returning();
            tenant = createdTenant[0];
            await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, dbUser.id));
          }
          if (tenant) {
            let websiteList = await db.select().from(websites).where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));
            let website = websiteList.length > 0 ? websiteList[0] : null;
            if (!website) {
              const createdWeb = await db.insert(websites).values({
                tenantId: tenant.id,
                templateId: parseInt(wsRecord.templateId || '1', 10) || 1,
                assignedUserEmail: dbUser.email
              }).returning();
              website = createdWeb[0];
            } else {
              await db.update(websites).set({ templateId: parseInt(wsRecord.templateId || '1', 10) || 1 }).where(eq(websites.id, website.id));
            }
            if (website) {
              const existingContent = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, website.id), isNull(websiteContent.deletedAt)));
              if (existingContent.length === 0) {
                await db.insert(websiteContent).values({ websiteId: website.id, content: customizations, updatedAt: new Date() });
              } else {
                await db.update(websiteContent).set({ content: customizations, updatedAt: new Date() }).where(eq(websiteContent.id, existingContent[0].id));
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('Workspace live content sync notice:', syncErr);
      }
    }

    res.json({ workspace: wsRecord || { id, name, customizations, settings, status, domain } });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update workspace', details: error.message });
  }
});

// 6. Saved Templates
router.get('/api/saved-templates', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.query.userId as string) || 'default_client';
    const allTemplates = await db.select().from(savedTemplates);
    const filtered = allTemplates.filter(st => {
      if (!st.userId || st.userId === 'default_client' || st.userId === 'usr_default' || st.userId.startsWith('guest_')) return true;
      if (userId === 'admin_all_templates' || userId === 'all' || userId === 'usr_default' || userId === 'default_client') return true;
      if (st.userId === userId) return true;
      return false;
    });
    res.json({ savedTemplates: filtered });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch saved templates' });
  }
});

router.post('/api/saved-templates', async (req: express.Request, res: express.Response) => {
  try {
    const sys = getSystemSettings();
    if (sys.lockSaveEdits) {
      return res.status(403).json({ error: sys.customNoticeMessage || 'مغلق الآن: حفظ التعديلات مغلق حالياً من قبل الإدارة' });
    }
    const { userId, templateId, templateName, previewImage, category, customConfig } = req.body;
    const inserted = await db.insert(savedTemplates).values({
      userId: userId || 'default_client',
      templateId: String(templateId),
      templateName: templateName || 'قالب مخصص',
      previewImage,
      category,
      customConfig: customConfig || {},
    }).returning();

    res.status(201).json({ savedTemplate: inserted[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save template' });
  }
});

router.delete('/api/saved-templates/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(savedTemplates).where(eq(savedTemplates.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete saved template' });
  }
});

// 7. Audit Logs & Templates List
router.get('/api/audit-logs', async (req: express.Request, res: express.Response) => {
  try {
    const logs = await db.select().from(auditLogs);
    res.json({ auditLogs: logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

const DEFAULT_TEMPLATES_SEED = [
  { id: 1, name: 'قالب المطعم الإيطالي والفاخر', category: 'restaurants', description: 'تصميم ملكي راقي مخصص للمطاعم الفاخرة والفاين دايننج.', type: 'built-in', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800', defaultContent: {} },
  { id: 2, name: 'قالب برجر ستيشن للوجبات السريعة', category: 'restaurants', description: 'قالب حيوي وجذاب بمظهر عصري يبرز صور البرجر والوجبات.', type: 'built-in', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800', defaultContent: {} },
  { id: 3, name: 'قالب بيتزا ووجبات عائلية', category: 'restaurants', description: 'واجهة متكاملة مخصصة لمطاعم البيتزا والوجبات العائلية.', type: 'built-in', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800', defaultContent: {} },
  { id: 4, name: 'قالب كافيه وقهوة كلاسيك', category: 'cafes', description: 'تصميم دافئ وراقي يعكس أجواء المقاهي الكلاسيكية.', type: 'built-in', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800', defaultContent: {} },
  { id: 5, name: 'قالب محمص وقهوة مختصة', category: 'cafes', description: 'واجهة عصرية متطورة لعشاق القهوة المختصة والمحمصة.', type: 'built-in', image: 'https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800', defaultContent: {} },
  { id: 6, name: 'قالب بوتيك الحلويات والآيس كريم', category: 'cafes', description: 'تصميم مبهج وملون يبرز كعكات المناسبات والحلويات.', type: 'built-in', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800', defaultContent: {} },
  { id: 7, name: 'قالب العقارات والفلل الفاخرة', category: 'realestate', description: 'تصميم فخم وعصري يعكس الفخامة لتسويق الفلل والقصور.', type: 'built-in', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800', defaultContent: {} },
  { id: 8, name: 'قالب الشقق والمجمعات السكنية', category: 'realestate', description: 'واجهة هادئة وعملية لتصفح الشقق المتاحة للإيجار أو الشراء.', type: 'built-in', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800', defaultContent: {} },
  { id: 9, name: 'قالب المركز والمكتب العقاري الرسمي', category: 'realestate', description: 'قالب مؤسسي رصين يعزز الثقة في خدمات إدارة الأملاك.', type: 'built-in', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800', defaultContent: {} },
  { id: 10, name: 'قالب شركات المقاولات والبناء العام', category: 'contractors', description: 'قالب مهني قوي يبرز المشاريع الإنشائية والخدمات الهندسية.', type: 'built-in', image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800', defaultContent: {} },
  { id: 11, name: 'قالب الاستشارات والتصميم المعماري', category: 'contractors', description: 'تصميم عصري وفني يبرز الأفكار المعمارية المبتكرة والمخططات.', type: 'built-in', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800', defaultContent: {} },
  { id: 12, name: 'قالب التصميم الداخلي والتجديد', category: 'contractors', description: 'يعرض أفكار الديكور المودرن مع ميزة تفاعلية قبل وبعد التعديل.', type: 'built-in', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800', defaultContent: {} },
  { id: 13, name: 'قالب أزياء وبوتيك فاخر (Haute Couture)', category: 'fashion', description: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات.', type: 'built-in', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800', defaultContent: {} },
  { id: 14, name: 'متجر الأجهزة الإلكترونية والتقنية', category: 'electronics', description: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية.', type: 'built-in', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800', defaultContent: {} },
  { id: 15, name: 'متجر العناية بالبشرة والجسم', category: 'beauty', description: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم.', type: 'built-in', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800', defaultContent: {} },
  { id: 16, name: 'قالب عيادة الأسنان المتقدمة', category: 'medical', description: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان.', type: 'built-in', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800', defaultContent: {} }
];

router.get('/api/templates/all', async (req: express.Request, res: express.Response) => {
  try {
    const allTemplates = await db.select().from(templates);

    const existingMap = new Map(allTemplates.map(t => [Number(t.id), t]));
    const mergedTemplates = DEFAULT_TEMPLATES_SEED.map(dt => {
      const dbT = existingMap.get(dt.id);
      if (dbT) {
        return {
          ...dt,
          ...dbT,
          name: dbT.name || dt.name,
          description: dbT.description || dt.description,
          image: dbT.image || dt.image,
          category: dbT.category || dt.category
        };
      }
      return dt;
    });

    // Also include any custom templates from db that have id > 16
    allTemplates.forEach(t => {
      if (Number(t.id) > 16 && !mergedTemplates.some(m => m.id === t.id)) {
        mergedTemplates.push(t);
      }
    });

    res.json({ templates: mergedTemplates });
  } catch (error: any) {
    console.warn('Error fetching db templates, using fallback seed:', error?.message || error);
    res.json({ templates: DEFAULT_TEMPLATES_SEED });
  }
});

export default router;

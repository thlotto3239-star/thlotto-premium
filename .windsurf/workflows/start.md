---
description: Onboarding workflow for new AI session - read all rules + sync git + report status
---

# Start Workflow — สำหรับ AI ใหม่ทุก session

ก่อนทำอะไรเลย — รัน workflow นี้เพื่อเข้าใจโปรเจกต์

## ขั้นตอน

1. อ่าน `AGENT_HANDOFF.md` — quick start guide
2. อ่าน `.windsurfrules` — กฎเหล็ก
3. อ่าน `PROJECT_STATUS.md` — สถานะปัจจุบัน
4. อ่าน `CHANGELOG.md` — มีอะไรเปลี่ยนล่าสุด
5. อ่าน `DEVELOPMENT_GUIDE.md` — วิธีทำงาน

6. Sync git
// turbo
```powershell
git remote -v; git fetch origin; git status; git log --oneline -n 5
```

7. ตรวจ Supabase
- ใช้ MCP tool `mcp1_list_tables` ดู tables
- ใช้ `mcp1_get_advisors type=security` ดู security issues
- ใช้ `mcp1_get_advisors type=performance` ดู performance issues

8. รายงานสรุปให้ผู้ใช้ก่อน:
   - "อ่านครบแล้ว เข้าใจว่าโปรเจกต์มี [...]"
   - "สถานะปัจจุบัน: [...]"
   - "งานล่าสุด: [...]"
   - "ผู้ใช้ต้องการอะไรในรอบนี้?"

## ห้ามข้าม
- ห้ามเริ่มแก้โค้ดโดยไม่อ่าน 5 ไฟล์ข้างบน
- ห้ามเดา URL/path/field name — อ่านจากเอกสาร

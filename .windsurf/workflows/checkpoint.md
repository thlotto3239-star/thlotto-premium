---
description: Safety checkpoint before any major code change (commit + tag + push backup)
---

# Safety Checkpoint Workflow

ใช้ก่อนแก้โค้ดใหญ่ทุกครั้ง — เพื่อให้ rollback ได้ถ้าเสียหาย

## ขั้นตอน

1. ตรวจสถานะปัจจุบัน
// turbo
```powershell
git status; git log --oneline -n 3
```

2. ตรวจว่า remote เชื่อมแล้วและ branch ตรง
// turbo
```powershell
git remote -v; git branch --show-current
```

3. ถ้ามี changes ที่ยัง uncommit — commit ก่อน
```powershell
git add -A
git commit -m "checkpoint: <describe state> [auto]"
```

4. Pull ล่าสุดจาก remote เผื่อมีการ deploy นอก local
// turbo
```powershell
git fetch origin; git status
```

5. สร้าง tag stable พร้อม note
```powershell
$date = Get-Date -Format "yyyy-MM-dd-HHmm"
git tag -a "stable-$date" -m "Stable before: <topic>"
git push origin "stable-$date"
```

6. (Optional) สร้าง branch ใหม่สำหรับงาน
```powershell
git checkout -b feat/<topic>-<date>
```

7. ยืนยันสภาพปลอดภัย
// turbo
```powershell
git log --oneline -n 5; git tag --list | Select-Object -Last 5
```

## เสร็จแล้ว
- Local + Remote มี checkpoint
- ถ้างานเสีย → `git reset --hard stable-<date>` กลับมาได้ทันที
- เริ่มงานบน feature branch ได้อย่างปลอดภัย

/**
 * CSV Import Button Integration
 * إضافة زر استيراد CSV إلى واجهة البرنامج
 */

// انتظر تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  // أضف الزر إلى ribbon
  addCSVImportButton();
});

function addCSVImportButton() {
  // ابحث عن مجموعة الاستيراد/التصدير
  const exportBtn = document.getElementById('exportBtn');
  
  if (exportBtn) {
    // أنشئ زر CSV Import
    const csvImportBtn = document.createElement('button');
    csvImportBtn.id = 'csvImportBtn';
    csvImportBtn.className = 'tool-btn';
    csvImportBtn.title = 'استيراد نقاط من CSV (Total Station)';
    csvImportBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 15.5V2.5" stroke-width="2.3"/>
        <path d="M7 7l5-5 5 5" stroke-width="2.3"/>
        <rect x="3" y="18" width="18" height="3.5" rx="1.5" fill="currentColor" opacity=".22" stroke-width="1.4"/>
        <path d="M8 10h8M8 13h8M8 16h5" stroke-width="1.5" opacity=".6"/>
      </svg>
      <span>CSV</span>
    `;
    
    // أضف الأسلوب للزر
    csvImportBtn.setAttribute('data-tool', 'csv-import');
    csvImportBtn.style.setProperty('--tc', '#E8A432');
    
    // أضف الحدث
    csvImportBtn.addEventListener('click', () => {
      CSVImporter.createImportDialog();
    });
    
    // ابحث عن الحاوية الصحيحة وأضف الزر
    const importBtn = document.getElementById('importBtn');
    if (importBtn && importBtn.parentElement) {
      importBtn.parentElement.insertBefore(csvImportBtn, importBtn.nextSibling);
    }
  }
}

// دعم إضافة زر CSV Import من داخل قائمة الإدراج أيضاً
window.addEventListener('load', () => {
  // يمكن إضافة زر آخر في تبويب الإدراج إذا كان ضرورياً
  const insertPanel = document.querySelector('[data-ribbon-panel="insert"]');
  if (insertPanel && !document.getElementById('csvImportDialogBtn')) {
    const csvImportDialogBtn = document.createElement('button');
    csvImportDialogBtn.id = 'csvImportDialogBtn';
    csvImportDialogBtn.className = 'tool-btn';
    csvImportDialogBtn.title = 'استيراد نقاط CSV (نقاط من مسّاح Total Station)';
    csvImportDialogBtn.style.setProperty('--tc', '#E8A432');
    csvImportDialogBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 15.5V2.5" stroke-width="2.3"/>
        <path d="M7 7l5-5 5 5" stroke-width="2.3"/>
        <rect x="3" y="18" width="18" height="3.5" rx="1.5" fill="currentColor" opacity=".22" stroke-width="1.4"/>
        <path d="M8 10h8M8 13h8M8 16h5" stroke-width="1.5" opacity=".6"/>
      </svg>
      <span>CSV TS</span>
    `;
    
    csvImportDialogBtn.addEventListener('click', () => {
      CSVImporter.createImportDialog();
    });
  }
});

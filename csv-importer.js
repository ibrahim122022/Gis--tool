/**
 * CSV Importer Module - Total Station Integration
 * دعم استيراد نقاط من ملفات CSV مع تحديد المسقط (UTM/ETM) والزون
 */

const CSVImporter = {
  // أنظمة الإحداثيات المدعومة
  projectionSystems: {
    UTM: {
      name: 'UTM (Universal Transverse Mercator)',
      proj: '+proj=utm +zone={zone} +datum=WGS84 +units=m +no_defs',
      zoneRange: { min: 1, max: 60 },
      defaultZone: 36
    },
    ETM: {
      name: 'ETM (Egyptian Transverse Mercator)',
      proj: '+proj=tmerc +lat_0=30 +lon_0={lon} +k=0.9998 +x_0=500000 +y_0=0 +datum=WGS84 +units=m +no_defs',
      zones: {
        'ETM Zone 1': { lon: 24, centerLon: 24 },
        'ETM Zone 2': { lon: 27, centerLon: 27 },
        'ETM Zone 3': { lon: 30, centerLon: 30 },
        'ETM Zone 4': { lon: 33, centerLon: 33 }
      },
      defaultZone: 'ETM Zone 3'
    },
    WGS84: {
      name: 'WGS84 (Geographic - DD)',
      proj: '+proj=longlat +datum=WGS84 +no_defs',
      zoneRange: null
    },
    WGS84_DMS: {
      name: 'WGS84 (DMS - Degree/Minute/Second)',
      proj: '+proj=longlat +datum=WGS84 +no_defs',
      zoneRange: null
    }
  },

  // إنشاء واجهة الاستيراد
  createImportDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'csvImportDialog';
    dialog.className = 'rect-hud';
    dialog.style.display = 'block';
    dialog.style.width = '380px';
    dialog.innerHTML = `
      <div style="max-height: 80vh; overflow-y: auto;">
        <h4 style="margin: 0 0 12px; font-size: 13px; color: var(--accent); font-weight: 600;">
          استيراد نقاط من CSV
        </h4>

        <!-- File Upload -->
        <label style="display: block; font-size: 10.5px; color: var(--text-muted); margin-bottom: 6px;">
          اختر ملف CSV:
        </label>
        <input type="file" id="csvFileInput" accept=".csv,.txt" style="
          width: 100%; padding: 6px; border: 1px solid var(--border); 
          border-radius: 6px; font-size: 11px; background: var(--bg-panel-2);
        ">

        <!-- Projection System Selection -->
        <label style="display: block; font-size: 10.5px; color: var(--text-muted); margin-top: 10px; margin-bottom: 6px;">
          نظام الإحداثيات:
        </label>
        <select id="projectionSelect" style="
          width: 100%; padding: 6px; border: 1px solid var(--border); 
          border-radius: 6px; font-size: 11px; background: var(--bg-panel-2); color: var(--text);
        ">
          <option value="UTM">UTM - Universal Transverse Mercator</option>
          <option value="ETM">ETM - Egyptian Transverse Mercator</option>
          <option value="WGS84">WGS84 (Geographic - DD)</option>
          <option value="WGS84_DMS">WGS84 (DMS)</option>
        </select>

        <!-- Zone Selection (UTM/ETM) -->
        <div id="zoneContainer" style="margin-top: 10px;">
          <label style="display: block; font-size: 10.5px; color: var(--text-muted); margin-bottom: 6px;">
            الزون:
          </label>
          <select id="zoneSelect" style="
            width: 100%; padding: 6px; border: 1px solid var(--border); 
            border-radius: 6px; font-size: 11px; background: var(--bg-panel-2); color: var(--text);
          "></select>
        </div>

        <!-- CSV Format Helper -->
        <div style="
          background: var(--accent-soft); border-radius: 6px; padding: 8px; 
          margin-top: 10px; border-left: 3px solid var(--accent);
        ">
          <div style="font-size: 9.5px; color: var(--accent); font-weight: 600; margin-bottom: 4px;">
            صيغة الملف المتوقعة:
          </div>
          <code style="
            font-size: 9px; font-family: var(--mono); color: var(--text-muted);
            display: block; line-height: 1.6; white-space: pre-wrap; word-break: break-word;
          ">
X,Y,Name,Description
500000,3000000,نقطة1,وصف
500100,3000100,نقطة2,وصف
          </code>
        </div>

        <!-- Column Mapping -->
        <div style="margin-top: 10px;">
          <label style="display: block; font-size: 10.5px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">
            تعيين الأعمدة:
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <label style="font-size: 9.5px; color: var(--text-muted);">عمود X (الطول):</label>
              <input type="text" id="xColumn" placeholder="X أو Easting" style="
                width: 100%; padding: 4px; border: 1px solid var(--border); 
                border-radius: 4px; font-size: 10px; background: var(--bg-panel-2);
              ">
            </div>
            <div>
              <label style="font-size: 9.5px; color: var(--text-muted);">عمود Y (العرض):</label>
              <input type="text" id="yColumn" placeholder="Y أو Northing" style="
                width: 100%; padding: 4px; border: 1px solid var(--border); 
                border-radius: 4px; font-size: 10px; background: var(--bg-panel-2);
              ">
            </div>
          </div>
          <label style="font-size: 9.5px; color: var(--text-muted); margin-top: 6px; display: block;">
            عمود الاسم (اختياري):
          </label>
          <input type="text" id="nameColumn" placeholder="Name أو Code" style="
            width: 100%; padding: 4px; border: 1px solid var(--border); 
            border-radius: 4px; font-size: 10px; background: var(--bg-panel-2);
          ">
        </div>

        <!-- Delimiter Selection -->
        <div style="margin-top: 10px;">
          <label style="display: block; font-size: 10.5px; color: var(--text-muted); margin-bottom: 6px;">
            الفاصل:
          </label>
          <div style="display: flex; gap: 6px;">
            <label style="flex: 1; display: flex; align-items: center; font-size: 10px;">
              <input type="radio" name="delimiter" value="," checked> فاصلة (,)
            </label>
            <label style="flex: 1; display: flex; align-items: center; font-size: 10px;">
              <input type="radio" name="delimiter" value="\t"> Tab
            </label>
            <label style="flex: 1; display: flex; align-items: center; font-size: 10px;">
              <input type="radio" name="delimiter" value=";"> نقطة فاصلة (;)
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 6px; margin-top: 12px;">
          <button id="csvImportBtn" style="
            flex: 1; padding: 8px; background: var(--accent); color: white; 
            border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;
          ">استيراد</button>
          <button id="csvCancelBtn" style="
            flex: 1; padding: 8px; background: var(--bg-panel-2); color: var(--text-muted); 
            border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px;
          ">إلغاء</button>
        </div>

        <!-- Preview -->
        <div id="csvPreview" style="
          margin-top: 12px; padding: 8px; background: var(--bg-panel-2); 
          border-radius: 6px; display: none; max-height: 200px; overflow-y: auto;
        ">
          <div style="font-size: 9.5px; color: var(--accent); font-weight: 600; margin-bottom: 6px;">
            معاينة البيانات:
          </div>
          <table id="previewTable" style="width: 100%; font-size: 9px; border-collapse: collapse;">
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.positionDialog(dialog);
    this.attachEventListeners();
    this.updateZoneSelect();
  },

  // تحديث خيارات الزون بناءً على نظام الإحداثيات المختار
  updateZoneSelect() {
    const projectionSelect = document.getElementById('projectionSelect');
    const zoneSelect = document.getElementById('zoneSelect');
    const zoneContainer = document.getElementById('zoneContainer');
    const selectedProj = projectionSelect.value;

    zoneSelect.innerHTML = '';

    if (selectedProj === 'UTM') {
      zoneContainer.style.display = 'block';
      const { zoneRange } = this.projectionSystems.UTM;
      for (let i = zoneRange.min; i <= zoneRange.max; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `UTM Zone ${i}`;
        if (i === 36) option.selected = true;
        zoneSelect.appendChild(option);
      }
    } else if (selectedProj === 'ETM') {
      zoneContainer.style.display = 'block';
      const { zones } = this.projectionSystems.ETM;
      for (const zoneName in zones) {
        const option = document.createElement('option');
        option.value = zoneName;
        option.textContent = zoneName;
        if (zoneName === 'ETM Zone 3') option.selected = true;
        zoneSelect.appendChild(option);
      }
    } else {
      zoneContainer.style.display = 'none';
    }
  },

  // قراءة وتحليل ملف CSV
  parseCSV(content, delimiter = ',') {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('الملف يجب أن يحتوي على عنوان الأعمدة وبيانات واحدة على الأقل');
      return null;
    }

    const headers = lines[0].split(delimiter).map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return { headers, data };
  },

  // تحويل الإحداثيات من نظام إلى آخر
  convertCoordinates(x, y, fromProj, toProj = '+proj=longlat +datum=WGS84') {
    try {
      const result = proj4(fromProj, toProj, [x, y]);
      return { lon: result[0], lat: result[1] };
    } catch (error) {
      console.error('خطأ في تحويل الإحداثيات:', error);
      return null;
    }
  },

  // تحويل DMS إلى Decimal Degrees
  dmsToDD(degrees, minutes, seconds, direction) {
    let dd = Math.abs(degrees) + Math.abs(minutes) / 60 + Math.abs(seconds) / 3600;
    if (direction === 'S' || direction === 'W') dd *= -1;
    return dd;
  },

  // معالجة استيراد البيانات
  async importData() {
    const fileInput = document.getElementById('csvFileInput');
    const projectionSelect = document.getElementById('projectionSelect');
    const zoneSelect = document.getElementById('zoneSelect');
    const xColumnInput = document.getElementById('xColumn');
    const yColumnInput = document.getElementById('yColumn');
    const nameColumnInput = document.getElementById('nameColumn');
    const delimiter = document.querySelector('input[name="delimiter"]:checked').value;

    if (!fileInput.files.length) {
      alert('يرجى اختيار ملف');
      return;
    }

    const file = fileInput.files[0];
    const content = await file.text();
    const parsedData = this.parseCSV(content, delimiter);

    if (!parsedData) return;

    const { headers, data } = parsedData;
    const selectedProj = projectionSelect.value;
    const selectedZone = zoneSelect.value;
    const xColumn = xColumnInput.value || 'X';
    const yColumn = yColumnInput.value || 'Y';
    const nameColumn = nameColumnInput.value || 'Name';

    // تحديد proj4 string
    let projString = this.getProjString(selectedProj, selectedZone);

    // تحويل البيانات
    const features = [];
    for (const row of data) {
      let x = parseFloat(row[xColumn]);
      let y = parseFloat(row[yColumn]);
      const name = row[nameColumn] || `نقطة_${features.length + 1}`;

      if (isNaN(x) || isNaN(y)) continue;

      // تحويل الإحداثيات إلى WGS84
      let coords;
      if (selectedProj === 'WGS84_DMS') {
        // معالجة DMS
        coords = { lon: x, lat: y }; // يتطلب معالجة خاصة حسب الصيغة
      } else if (selectedProj === 'WGS84') {
        coords = { lon: x, lat: y };
      } else {
        coords = this.convertCoordinates(x, y, projString);
      }

      if (!coords) continue;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords.lon, coords.lat]
        },
        properties: {
          name: name,
          x: x,
          y: y,
          originalProj: selectedProj,
          zone: selectedZone,
          ...row
        }
      });
    }

    this.addPointsToMap(features);
    this.closeDialog();
  },

  // الحصول على proj4 string
  getProjString(projType, zone) {
    if (projType === 'UTM') {
      return this.projectionSystems.UTM.proj.replace('{zone}', zone);
    } else if (projType === 'ETM') {
      const zoneData = this.projectionSystems.ETM.zones[zone];
      return this.projectionSystems.ETM.proj.replace('{lon}', zoneData.lon);
    } else if (projType === 'WGS84') {
      return this.projectionSystems.WGS84.proj;
    }
    return this.projectionSystems.WGS84.proj;
  },

  // إضافة النقاط إلى الخريطة
  addPointsToMap(features) {
    // إنشاء طبقة جديدة
    const layerName = `CSV Import - ${new Date().toLocaleTimeString()}`;
    const layerData = {
      type: 'FeatureCollection',
      features: features
    };

    // إضافة الطبقة إلى النظام (يتطلب integration مع الكود الموجود)
    if (window.geoJsonLayer && window.map) {
      try {
        // إضافة الميزات إلى خريطة Leaflet
        L.geoJSON(layerData, {
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 6,
              fillColor: '#2563eb',
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).bindPopup(`<strong>${feature.properties.name}</strong>`);
          }
        }).addTo(window.map);

        alert(`تم استيراد ${features.length} نقطة بنجاح!`);
      } catch (error) {
        console.error('خطأ في إضافة النقاط:', error);
        alert('حدث خطأ أثناء إضافة النقاط');
      }
    }
  },

  // ربط مستمعات الأحداث
  attachEventListeners() {
    const projectionSelect = document.getElementById('projectionSelect');
    const csvImportBtn = document.getElementById('csvImportBtn');
    const csvCancelBtn = document.getElementById('csvCancelBtn');
    const csvFileInput = document.getElementById('csvFileInput');

    projectionSelect.addEventListener('change', () => this.updateZoneSelect());
    csvImportBtn.addEventListener('click', () => this.importData());
    csvCancelBtn.addEventListener('click', () => this.closeDialog());
    csvFileInput.addEventListener('change', () => this.previewCSV());
  },

  // معاينة بيانات CSV
  previewCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const preview = document.getElementById('csvPreview');
    const previewTable = document.getElementById('previewTable');

    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      const delimiter = document.querySelector('input[name="delimiter"]:checked').value;
      const parsedData = this.parseCSV(content, delimiter);

      if (!parsedData) return;

      const { headers, data } = parsedData;
      let html = '<tr style="background: var(--accent-soft);">';

      headers.forEach(header => {
        html += `<th style="padding: 4px; border: 1px solid var(--border); font-weight: 600;">${header}</th>`;
      });
      html += '</tr>';

      data.slice(0, 5).forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td style="padding: 4px; border: 1px solid var(--border);">${row[header] || '-'}</td>`;
        });
        html += '</tr>';
      });

      previewTable.innerHTML = html;
      preview.style.display = 'block';
    };

    reader.readAsText(file);
  },

  // تحديد موضع الحوار
  positionDialog(dialog) {
    const map = document.getElementById('map');
    if (map) {
      const rect = map.getBoundingClientRect();
      dialog.style.left = (rect.left + rect.width / 2 - 190) + 'px';
      dialog.style.top = (rect.top + rect.height / 2 - 250) + 'px';
    }
  },

  // إغلاق الحوار
  closeDialog() {
    const dialog = document.getElementById('csvImportDialog');
    if (dialog) {
      dialog.remove();
    }
  }
};

// تصدير الوحدة
window.CSVImporter = CSVImporter;

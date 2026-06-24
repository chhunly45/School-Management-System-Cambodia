// Cambodia Provinces and Districts
const provinces = [
  {
    id: 1,
    name: 'Phnom Penh',
    nameKh: 'ភ្នំពេញ',
    districts: [
      { id: 101, name: 'Daun Penh', nameKh: 'ដូនពេញ' },
      { id: 102, name: 'Chamkarmon', nameKh: 'ចម្ការម៉ន' },
      { id: 103, name: 'Russey Keo', nameKh: 'រុស្សីកែវ' },
      { id: 104, name: 'Mean Chey', nameKh: 'មានជ័យ' },
      { id: 105, name: 'Toul Kouk', nameKh: 'ទូលគោក' },
      { id: 106, name: 'Prampi Makara', nameKh: 'ព្រំពិមក្រ' },
      { id: 107, name: 'Dangkao', nameKh: 'ដង្កៀវ' },
      { id: 108, name: 'Chbar Ampov', nameKh: 'ច្បារអំពៅ' },
      { id: 109, name: 'Sen Sok', nameKh: 'សែនសុខ' },
      { id: 110, name: 'Kamboul', nameKh: 'កម្បូល' },
      { id: 111, name: 'Borey Keila', nameKh: 'បូរីកីឡា' },
      { id: 112, name: 'Posenchey', nameKh: 'ពោធិ៍សេនចៃ' }
    ]
  },
  {
    id: 2,
    name: 'Banteay Meanchey',
    nameKh: 'បន្ទាយមានជ័យ',
    districts: [
      { id: 201, name: 'Sisophon', nameKh: 'សីសោផន' },
      { id: 202, name: 'Thmar Puok', nameKh: 'ធម្មរពួក' },
      { id: 203, name: 'Svay Chrum', nameKh: 'ស្វាយឆ្រុម' },
      { id: 204, name: 'Banteay Neap', nameKh: 'បន្ទាយនៀប' },
      { id: 205, name: 'Malai', nameKh: 'មលៃ' },
      { id: 206, name: 'Sohni', nameKh: 'សូនី' }
    ]
  },
  {
    id: 3,
    name: 'Battambang',
    nameKh: 'បាត់ដំបង',
    districts: [
      { id: 301, name: 'Battambang', nameKh: 'បាត់ដំបង' },
      { id: 302, name: 'Bavel', nameKh: 'បាវិល' },
      { id: 303, name: 'Rukhaka', nameKh: 'រុក្ខក' },
      { id: 304, name: 'Sampov Loun', nameKh: 'សម្ពោវលូន' },
      { id: 305, name: 'Sangkae', nameKh: 'សង្កែ' },
      { id: 306, name: 'Ek Phnom', nameKh: 'អេកផ្នום' },
      { id: 307, name: 'Aural', nameKh: 'អោរល' },
      { id: 308, name: 'Samlout', nameKh: 'សម្លៅត' }
    ]
  },
  {
    id: 4,
    name: 'Kampong Chaam',
    nameKh: 'កម្ពង់ចាម',
    districts: [
      { id: 401, name: 'Kampong Chaam', nameKh: 'កម្ពង់ចាម' },
      { id: 402, name: 'Batheay', nameKh: 'បាធេយ' },
      { id: 403, name: 'Chhllong', nameKh: 'ឆ្លោង' },
      { id: 404, name: 'Krouch Chhmar', nameKh: 'ក្របច្ឆមារ' },
      { id: 405, name: 'Memot', nameKh: 'មេមត' },
      { id: 406, name: 'Prasat', nameKh: 'ប្រាសាទ' },
      { id: 407, name: 'Tbong Khmum', nameKh: 'ត្បូងឃ្មុំ' },
      { id: 408, name: 'Kampong Siem', nameKh: 'កម្ពង់សៀម' }
    ]
  },
  {
    id: 5,
    name: 'Kampong Chhnang',
    nameKh: 'កម្ពង់ឆ្នាំង',
    districts: [
      { id: 501, name: 'Kampong Chhnang', nameKh: 'កម្ពង់ឆ្នាំង' },
      { id: 502, name: 'Bayon', nameKh: 'បាយោន' },
      { id: 503, name: 'Kompong Tralach', nameKh: 'កម្ពង់ត្រលាច' },
      { id: 504, name: 'Rolea Bac', nameKh: 'រលេងបាក់' },
      { id: 505, name: 'Stung Saen', nameKh: 'ស្ទឹងសែន' },
      { id: 506, name: 'Thma Koul', nameKh: 'ធម៉ាគោល' }
    ]
  },
  {
    id: 6,
    name: 'Kampong Speu',
    nameKh: 'កម្ពង់ស្ពឺ',
    districts: [
      { id: 601, name: 'Kampong Speu', nameKh: 'កម្ពង់ស្ពឺ' },
      { id: 602, name: 'Chbar Mon', nameKh: 'ច្បារម៉ន' },
      { id: 603, name: 'Ompil', nameKh: 'អម្ពិល' },
      { id: 604, name: 'Samroong', nameKh: 'សម្រូង' },
      { id: 605, name: 'Kong Pisei', nameKh: 'កងពិសី' },
      { id: 606, name: 'Koh Kong', nameKh: 'កោះកង' }
    ]
  },
  {
    id: 7,
    name: 'Kampong Thom',
    nameKh: 'កម្ពង់ធំ',
    districts: [
      { id: 701, name: 'Kampong Thom', nameKh: 'កម្ពង់ធំ' },
      { id: 702, name: 'Baray', nameKh: 'បារាយ' },
      { id: 703, name: 'Prasat Balangk', nameKh: 'ប្រាសាទបាលង្ក' },
      { id: 704, name: 'Santuk', nameKh: 'សន្ទុក' },
      { id: 705, name: 'Chhlong', nameKh: 'ឆ្លង' },
      { id: 706, name: 'Stung', nameKh: 'ស្ទឹង' }
    ]
  },
  {
    id: 8,
    name: 'Kandal',
    nameKh: 'កណ្ដាល',
    districts: [
      { id: 801, name: 'Kandal', nameKh: 'កណ្ដាល' },
      { id: 802, name: 'Kien Svay', nameKh: 'គីលស្វាយ' },
      { id: 803, name: 'Kaoh Thom', nameKh: 'កោះថម' },
      { id: 804, name: 'Ta Khmau', nameKh: 'តាឃ្មោ' },
      { id: 805, name: 'Ang Snuol', nameKh: 'អង្គស្នួល' },
      { id: 806, name: 'Leuk Daek', nameKh: 'លើកដាក់' },
      { id: 807, name: 'Ponhea Leu', nameKh: 'ពន្ហាលើ' }
    ]
  },
  {
    id: 9,
    name: 'Kratié',
    nameKh: 'ក្រatie',
    districts: [
      { id: 901, name: 'Kratié', nameKh: 'ក្រតié' },
      { id: 902, name: 'Chhlong', nameKh: 'ឆ្លង' },
      { id: 903, name: 'Snuol', nameKh: 'ស្នួល' },
      { id: 904, name: 'Banlung', nameKh: 'បាន់លុង' },
      { id: 905, name: 'Sambor', nameKh: 'សម្ពោ' }
    ]
  },
  {
    id: 10,
    name: 'Koh Kong',
    nameKh: 'កោះកង',
    districts: [
      { id: 1001, name: 'Koh Kong', nameKh: 'កោះកង' },
      { id: 1002, name: 'Andaung Meas', nameKh: 'អន្ដាងមាស' },
      { id: 1003, name: 'Botum Sakor', nameKh: 'បតុមសាកុល' },
      { id: 1004, name: 'Sre Ambel', nameKh: 'ស្រីអម្បល' }
    ]
  },
  {
    id: 11,
    name: 'Mondolkiri',
    nameKh: 'មណ្ឌលគីរី',
    districts: [
      { id: 1101, name: 'Sen Monorom', nameKh: 'សែនមនោរម' },
      { id: 1102, name: 'Keo Seima', nameKh: 'គេអូសីមា' },
      { id: 1103, name: 'Pich Chreada', nameKh: 'ពិច័ជ្រើតា' }
    ]
  },
  {
    id: 12,
    name: 'Oddar Meanchey',
    nameKh: 'អដ្ឋមានជ័យ',
    districts: [
      { id: 1201, name: 'Samraong', nameKh: 'សម្រាង' },
      { id: 1202, name: 'Anlong Veng', nameKh: 'អាលង់វែង' },
      { id: 1203, name: 'Banteay Ampil', nameKh: 'បន្ទាយអំពិល' }
    ]
  },
  {
    id: 13,
    name: 'Pailin',
    nameKh: 'ប៉ៃលិន',
    districts: [
      { id: 1301, name: 'Pailin', nameKh: 'ប៉ៃលិន' },
      { id: 1302, name: 'Sala Krau', nameKh: 'សាលក្រៅ' }
    ]
  },
  {
    id: 14,
    name: 'Preah Sihanouk',
    nameKh: 'ព្រះសីហនុ',
    districts: [
      { id: 1401, name: 'Sihanoukville', nameKh: 'ព្រះសីហនុ' },
      { id: 1402, name: 'Kampong Seila', nameKh: 'កម្ពង់សីលា' },
      { id: 1403, name: 'Botum Sakor', nameKh: 'បតុមសាកុល' },
      { id: 1404, name: 'Preah Sihanouk', nameKh: 'ព្រះសីហនុ' }
    ]
  },
  {
    id: 15,
    name: 'Preah Vihear',
    nameKh: 'ព្រះវិហារ',
    districts: [
      { id: 1501, name: 'Preah Vihear', nameKh: 'ព្រះវិហារ' },
      { id: 1502, name: 'Chheu Teal', nameKh: 'ឈើធីល' },
      { id: 1503, name: 'Kulen', nameKh: 'គុលេន' },
      { id: 1504, name: 'Rovieng', nameKh: 'រវៀង' },
      { id: 1505, name: 'Tbeng Meanchey', nameKh: 'ត្បែងមានជ័យ' }
    ]
  },
  {
    id: 16,
    name: 'Pursat',
    nameKh: 'បួរស័ត',
    districts: [
      { id: 1601, name: 'Pursat', nameKh: 'បួរស័ត' },
      { id: 1602, name: 'Bakan', nameKh: 'បាកាន់' },
      { id: 1603, name: 'Sampov Loun', nameKh: 'សម្ពោវលូន' },
      { id: 1604, name: 'Kravanh', nameKh: 'ក្រវាញ' }
    ]
  },
  {
    id: 17,
    name: 'Ratanakiri',
    nameKh: 'រតនគីរី',
    districts: [
      { id: 1701, name: 'Banlung', nameKh: 'បាន់លុង' },
      { id: 1702, name: 'Andoung Meas', nameKh: 'អន្ដាងមាស' },
      { id: 1703, name: 'Kaoh Nhaet', nameKh: 'កោះងាត់' },
      { id: 1704, name: 'Lumphat', nameKh: 'លំផាត់' }
    ]
  },
  {
    id: 18,
    name: 'Siem Reap',
    nameKh: 'សៀមរាប',
    districts: [
      { id: 1801, name: 'Siem Reap', nameKh: 'សៀមរាប' },
      { id: 1802, name: 'Angkor', nameKh: 'អង្គរ' },
      { id: 1803, name: 'Banteay Srei', nameKh: 'បន្ទាយស្រី' },
      { id: 1804, name: 'Kralanh', nameKh: 'ក្រឡាញ' },
      { id: 1805, name: 'Puok', nameKh: 'ពួក' },
      { id: 1806, name: 'Stueng Saen', nameKh: 'ស្ទឹងសែន' }
    ]
  },
  {
    id: 19,
    name: 'Stung Treng',
    nameKh: 'ស្ទឹងត្រែង',
    districts: [
      { id: 1901, name: 'Stung Treng', nameKh: 'ស្ទឹងត្រែង' },
      { id: 1902, name: 'Sesan', nameKh: 'សេសាន' },
      { id: 1903, name: 'Kulen', nameKh: 'គុលេន' }
    ]
  },
  {
    id: 20,
    name: 'Svay Rieng',
    nameKh: 'ស្វាយរៀង',
    districts: [
      { id: 2001, name: 'Svay Rieng', nameKh: 'ស្វាយរៀង' },
      { id: 2002, name: 'Rumduol', nameKh: 'រូមឌូល' },
      { id: 2003, name: 'Chantrea', nameKh: 'ចាន្ត្របា' },
      { id: 2004, name: 'Nimit', nameKh: 'នីមិត' }
    ]
  },
  {
    id: 21,
    name: 'Takéo',
    nameKh: 'តាកែវ',
    districts: [
      { id: 2101, name: 'Takéo', nameKh: 'តាកែវ' },
      { id: 2102, name: 'Doun Kaev', nameKh: 'ដូនកែវ' },
      { id: 2103, name: 'Bati', nameKh: 'បាទី' },
      { id: 2104, name: 'Chhuk', nameKh: 'ឆុក' },
      { id: 2105, name: 'Kirivong', nameKh: 'គីរីវង' },
      { id: 2106, name: 'Tram Kak', nameKh: 'ត្រាមកាក់' },
      { id: 2107, name: 'Angkor Borei', nameKh: 'អង្គរបូរី' }
    ]
  }
];

const getProvinces = () => provinces;

const getDistrictsByProvince = (provinceId) => {
  const province = provinces.find((p) => p.id === Number(provinceId));
  return province?.districts || [];
};

const getProvinceName = (provinceId) => {
  const province = provinces.find((p) => p.id === Number(provinceId));
  return province?.name;
};

const getDistrictName = (provinceId, districtId) => {
  const districts = getDistrictsByProvince(provinceId);
  const district = districts.find((d) => d.id === Number(districtId));
  return district?.name;
};

module.exports = {
  provinces,
  getProvinces,
  getDistrictsByProvince,
  getProvinceName,
  getDistrictName
};

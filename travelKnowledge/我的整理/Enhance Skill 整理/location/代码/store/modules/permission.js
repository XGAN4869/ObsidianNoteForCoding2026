import { defineStore } from 'pinia';
import { apiGetRolePermissionInfo } from '@travel/api';
const normalizePermissionList = (list) => (Array.isArray(list) ? list : []);
const normalizeText = (value) => String(value ?? '').trim();
const getNestedPageButtons = (button) =>
  normalizePermissionList(button?.buttonInpage ?? button?.buttonInPage);

const normalizePath = (path) => {
  const normalizedPath = normalizeText(path);
  if (!normalizedPath) {
    return '';
  }

  return normalizedPath.replace(/,+$/g, '').replace(/\/+$/g, '') || '/';
};

const BUSINESS_MENU_DEFINITIONS = [
  {
    key: 'approval',
    title: '单据审批',
    desc: '审批各类业务单据',
    path: '/packageApproval/approval/index',
    matchVueUrls: ['/approval'],
    matchNames: ['单据审批中心', '单据审批'],
  },
  {
    key: 'attendance',
    title: '考勤与排班',
    desc: '考勤打卡与排班管理',
    path: '/packageAttendance/attendance/index',
    matchVueUrls: ['/attendance'],
    matchNames: ['员工考勤统计', '考勤与排班', '考勤管理'],
  },
  {
    key: 'alarm',
    title: '一键报警',
    desc: '紧急情况快速上报',
    path: '/packageOther/alarm/index',
    matchVueUrls: ['/alarm'],
    matchNames: ['一键报警'],
  },
  {
    key: 'meeting',
    title: '会议纪要',
    desc: '会议记录与纪要管理',
    path: '/packageOther/meeting/index',
    matchVueUrls: ['/meeting'],
    matchNames: ['会议纪要'],
  },
  {
    key: 'job-feedback',
    title: '岗位反馈',
    desc: '岗位问题反馈与跟进',
    path: '/packageOther/feedback/index',
    matchVueUrls: ['/jobFeedback'],
    matchNames: ['岗位反馈', '岗位反馈与建议'],
  },
  {
    key: 'complaint',
    title: '客诉管理',
    desc: '客户投诉处理与跟进',
    path: '/packageOther/customer-complaint/index',
    matchVueUrls: ['/complaint'],
    matchNames: ['客诉与反馈管理', '客诉管理', '客户反馈与处理'],
  },
];
//这里配置临时工静态路由
const TEMP_WORKER_MENU_KEYS = new Set(['approval', 'attendance']);

const normalizePermissionSource = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.menuOptions)) return res.menuOptions;
  if (Array.isArray(res?.data?.menuOptions)) return res.data.menuOptions;
  return [];
};

const businessMenuDefinitionMap = new Map(
  BUSINESS_MENU_DEFINITIONS.flatMap((definition, index) => {
    const entries = [
      ...normalizePermissionList(definition.matchVueUrls).map((path) => [`path:${normalizePath(path)}`, { definition, index }]),
      ...normalizePermissionList(definition.matchNames).map((name) => [`name:${normalizeText(name)}`, { definition, index }]),
    ];
    return entries;
  }),
);

const resolveBusinessMenuDefinition = (menu) => {
  const normalizedPath = normalizePath(menu?.vueUrl);
  if (normalizedPath && businessMenuDefinitionMap.has(`path:${normalizedPath}`)) {
    return businessMenuDefinitionMap.get(`path:${normalizedPath}`);
  }

  const normalizedName = normalizeText(menu?.name);
  if (normalizedName && businessMenuDefinitionMap.has(`name:${normalizedName}`)) {
    return businessMenuDefinitionMap.get(`name:${normalizedName}`);
  }

  return null;
};

const extractVisibleButtonCodes = (menuTree, fieldName) => {
  const codes = normalizePermissionSource(menuTree).flatMap((menu) => {
    if (menu?.display !== true) {
      return [];
    }

    return normalizePermissionList(menu?.[fieldName])
      .filter((button) => button?.display === true)
      .map((button) => normalizeText(button?.code))
      .filter(Boolean);
  });

  return [...new Set(codes)];
};

const extractNestedVisiblePageButtonCodes = (menuTree) => {
  const codes = normalizePermissionSource(menuTree).flatMap((menu) => {
    if (menu?.display !== true) {
      return [];
    }

    return normalizePermissionList(menu?.buttonInpage).flatMap((button) =>
      getNestedPageButtons(button)
        .filter((childButton) => childButton?.display === true)
        .map((childButton) => normalizeText(childButton?.code))
        .filter(Boolean),
    );
  });

  return [...new Set(codes)];
};

const extractMenuCodes = (menuTree) => {
  const codes = normalizePermissionSource(menuTree)
    .filter((menu) => menu?.display === true)
    .map((menu) => normalizeText(menu?.code))
    .filter(Boolean);

  return [...new Set(codes)];
};

const extractRuleNames = (menuTree) => [
  ...extractVisibleButtonCodes(menuTree, 'buttonInpage'),
  ...extractNestedVisiblePageButtonCodes(menuTree),
];

const extractDialogNames = (menuTree) => [
  ...extractVisibleButtonCodes(menuTree, 'buttonInDialog'),
  ...extractNestedVisiblePageButtonCodes(menuTree),
];

const extractVisibleMenuList = (menuTree) => {
  const menuMap = new Map();

  normalizePermissionSource(menuTree)
    .filter((menu) => menu?.display === true)
    .forEach((menu) => {
      const resolved = resolveBusinessMenuDefinition(menu);
      if (!resolved) {
        return;
      }

      const { definition, index } = resolved;
      const sortOrder = Number(menu?.orderIndex);

      menuMap.set(definition.key, {
        key: definition.key,
        title: definition.title,
        desc: definition.desc,
        path: definition.path || '',
        action: definition.action || '',
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : index,
      });
    });

  return BUSINESS_MENU_DEFINITIONS
    .filter((definition) => menuMap.has(definition.key))
    .map((definition) => {
      const { sortOrder, ...menu } = menuMap.get(definition.key);
      return menu;
    });
};

const createTempWorkerMenuList = () => BUSINESS_MENU_DEFINITIONS
  .filter((definition) => TEMP_WORKER_MENU_KEYS.has(definition.key))
  .map((definition) => ({
    key: definition.key,
    title: definition.title,
    desc: definition.desc,
    path: definition.path || '',
    action: definition.action || '',
  }));

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    menuList: [],
    menuCodes: [],
    ruleNames: [],
    dialogNames: [],
    loaded: false,
  }),
  actions: {
    setPermissionInfo(menuTree) {
      this.menuList = extractVisibleMenuList(menuTree);
      this.menuCodes = extractMenuCodes(menuTree);
      this.ruleNames = extractRuleNames(menuTree);
      this.dialogNames = extractDialogNames(menuTree);
      this.loaded = true;
    },
    setTempWorkerPermission() {
      this.menuList = createTempWorkerMenuList();
      this.menuCodes = [];
      this.ruleNames = [];
      this.dialogNames = [];
      this.loaded = true;
    },
    async fetchPermissionInfo(reload = false) {
      if (this.loaded && !reload) {
        return this.menuList;
      }
      
      const res = await apiGetRolePermissionInfo();
      this.setPermissionInfo(res);
      return this.menuList;
    },
    resetPermission() {
      this.menuList = [];
      this.menuCodes = [];
      this.ruleNames = [];
      this.dialogNames = [];
      this.loaded = false;
    },
  },
  persist: true,
});


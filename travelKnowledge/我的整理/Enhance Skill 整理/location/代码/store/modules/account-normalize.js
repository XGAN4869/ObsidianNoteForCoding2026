const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

const getDepartmentInfo = (accountInfo) => {
  return accountInfo?.roleVO?.departmentVO || accountInfo?.departmentVO || {};
};

export function normalizeAccountInfoResponse(res) {
  const normalizeAccountInfo = (accountInfo) => {
    if (!accountInfo || typeof accountInfo !== 'object') {
      return {};
    }

    const normalizedAvatar = accountInfo.avatarUrl || accountInfo.avatar || accountInfo.avator || '';
    return {
      ...accountInfo,
      avator: accountInfo.avator || normalizedAvatar,
      avatar: accountInfo.avatar || normalizedAvatar,
      avatarUrl: accountInfo.avatarUrl || normalizedAvatar,
    };
  };

  if (!res || typeof res !== 'object') {
    return {};
  }

  if (res.data?.accountInfo && typeof res.data.accountInfo === 'object') {
    return normalizeAccountInfo(res.data.accountInfo);
  }

  if (res.accountInfo && typeof res.accountInfo === 'object') {
    return normalizeAccountInfo(res.accountInfo);
  }

  if (res.data && typeof res.data === 'object') {
    return normalizeAccountInfo(res.data);
  }

  return normalizeAccountInfo(res);
}

export function deriveAccountFields(accountInfo) {
  const info = accountInfo && typeof accountInfo === 'object' ? accountInfo : {};
  const departmentInfo = getDepartmentInfo(info);
  const roleName = normalizeString(info?.roleVO?.name || info?.roleName || info?.postName || info?.positionName);
  const departmentName = normalizeString(departmentInfo?.name || info?.departmentName || info?.department);
  const departmentBelongBlock = normalizeString(departmentInfo?.belongBlock);
  const realName = normalizeString(info?.realName || info?.accountName || info?.name);
  const displayRole = roleName || departmentName || '集团内部成员';

  return {
    realName,
    roleName,
    departmentId: normalizeString(info?.roleVO?.departmentId ?? info?.departmentId),
    departmentName,
    departmentBelongBlock,
    displayRole,
  };
}

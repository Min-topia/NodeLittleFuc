// * 默认单组件选项
const defaultOptions = [
    {
        label: '锁定',
        key: MenuEnum.LOCK,
        icon: renderIcon(LockClosedOutlineIcon),
        fnHandle: chartEditStore.setLock
    },
    {
        label: '解锁',
        key: MenuEnum.UNLOCK,
        icon: renderIcon(LockOpenOutlineIcon),
        fnHandle: chartEditStore.setUnLock
    },
    {
        label: '隐藏',
        key: MenuEnum.HIDE,
        icon: renderIcon(EyeOffOutlineIcon),
        fnHandle: chartEditStore.setHide
    },
    {
        label: '显示',
        key: MenuEnum.SHOW,
        icon: renderIcon(EyeOutlineIcon),
        fnHandle: chartEditStore.setShow
    },
    {
        type: 'divider',
        key: 'd0'
    },
    {
        label: '复制',
        key: MenuEnum.COPY,
        icon: renderIcon(CopyIcon),
        fnHandle: chartEditStore.setCopy
    },
    {
        label: '剪切',
        key: MenuEnum.CUT,
        icon: renderIcon(CutIcon),
        fnHandle: chartEditStore.setCut
    },
    {
        label: '粘贴',
        key: MenuEnum.PARSE,
        icon: renderIcon(ClipboardOutlineIcon),
        fnHandle: chartEditStore.setParse
    },
    {
        type: 'divider',
        key: 'd1'
    },
    {
        label: '置顶',
        key: MenuEnum.TOP,
        icon: renderIcon(UpToTopIcon),
        fnHandle: chartEditStore.setTop
    },
    {
        label: '置底',
        key: MenuEnum.BOTTOM,
        icon: renderIcon(DownToBottomIcon),
        fnHandle: chartEditStore.setBottom
    },
    {
        label: '上移',
        key: MenuEnum.UP,
        icon: renderIcon(ChevronUpIcon),
        fnHandle: chartEditStore.setUp
    },
    {
        label: '下移',
        key: MenuEnum.DOWN,
        icon: renderIcon(ChevronDownIcon),
        fnHandle: chartEditStore.setDown
    },
    {
        type: 'divider',
        key: 'd2'
    },
    {
        label: '清空剪贴板',
        key: MenuEnum.CLEAR,
        icon: renderIcon(PaintBrushIcon),
        fnHandle: chartEditStore.setRecordChart
    },
    {
        label: '删除',
        key: MenuEnum.DELETE,
        icon: renderIcon(TrashIcon),
        fnHandle: chartEditStore.removeComponentList
    },
    {
        label: '创建分组',
        key: MenuEnum.GROUP,
        icon: renderIcon(Carbon3DSoftwareIcon),
        fnHandle: chartEditStore.setGroup
    },
    {
        label: '解除分组',
        key: MenuEnum.UN_GROUP,
        icon: renderIcon(Carbon3DCursorIcon),
        fnHandle: chartEditStore.setUnGroup
    }
]

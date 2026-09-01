[简体中文](README.zh.md) | [English](README.md)

# luci-app-pppoe-ip-log

一个用于 OpenWrt / ImmortalWrt 的 LuCI 应用，记录被监控的 PPPoE（或任意 WAN）接口的公网 IPv4 地址每次变化，并在 Web 界面中展示变更历史。

## 为什么需要它

许多 ISP 通过 PPPoE 分配动态公网 IP，会在重连、掉线或租约续期时发生变化。本包对每一次变化做带时间戳的记录，让你无需翻查系统日志即可回答“我的公网 IP 上次是什么时候变的？”、“IP 是否一直稳定？”之类的问题。

## 功能

- 记录每次变化的 时间、旧地址、新地址。
- 自动监控 PPPoE 接口（或你指定的固定接口）。
- 后台守护进程按可配置间隔轮询，并对 hotplug `iface` 事件即时记录。
- **公网地址探测（兼容 CGNAT，默认关闭）**：除本地接口地址外，还可从外部 echo 服务获取真实对公 IPv4 地址，因此即便 WAN 只能看到运营商级 NAT 地址（100.64.0.0/10）也能记录有效信息。两个值都会被记录；仅当开启该选项时，界面才显示公网地址列。
- Web 界面位于 **网络 → PPPoE IP Log**，包含当前状态面板、变更历史表格，以及“清空日志”操作。
- 变更历史只展示每次变更后的新地址（不再区分旧/新地址）。
- 界面标题处显示当前已安装版本号（如 `v1.2`）。
- 内置简体中文翻译（`luci-i18n-pppoe-ip-log-zh-cn`）。

## 安装

同时安装应用与翻译包：

```sh
opkg update
opkg install luci-app-pppoe-ip-log
opkg install luci-i18n-pppoe-ip-log-zh-cn
```

随后在 **网络 → PPPoE IP Log** 打开 Web 界面。

## 使用

安装后即可查看变更历史。守护进程自动启动，并在首次运行时记录第一条样本。

设置（网络 → PPPoE IP Log → 设置）：

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `1` | 启用/停用监控。 |
| `interface` | `auto` | `auto` = 所有 PPPoE 接口；否则为空格分隔的接口列表（如 `wan`）。 |
| `interval` | `30` | 守护进程轮询间隔（秒）。 |
| `max_entries` | `500` | 保留的历史最大行数（超出后裁剪最旧记录）。 |
| `public_ip_lookup` | `0` | 是否额外查询外部 echo 服务获取真实对公 IPv4 地址（兼容 CGNAT）。默认关闭；关闭时界面隐藏公网地址列，只记录接口地址。 |
| `echo_url` | 多个 | 一个或多个以纯文本返回调用方 IPv4 的 URL（列表）；按顺序尝试直到成功。 |

## 工作原理

- `/usr/sbin/pppoe-ip-log` 是后端脚本，提供 `check`、`clear`、`daemon`、`status`、`interfaces` 等动作。
- hotplug 脚本（`/etc/hotplug.d/iface/95-pppoe-ip-log`）在接口 up 时触发一次检查。
- procd 初始化脚本（`/etc/init.d/pppoe-ip-log`）启动守护进程。
- 数据存放在 `/etc/pppoe-ip-log/`：
  - `history.log` — 制表符分隔的变更记录（`epoch<TAB>time<TAB>iface<TAB>old_public<TAB>new_public<TAB>old_interface<TAB>new_interface`）。取值不可用时写入 `-`，界面只展示变更后的新地址。
  - `state` — 每个接口最后一次已知的接口地址与公网地址（未知时写 `-`，占位符用于保持列结构稳定）。
  - `status.json` — 供 Web 界面消费的当前状态（`address` = 接口 IP，`public_address` = 对公 IP，`public_lookup` = 是否启用公网探测，`version` = 已安装版本号）。

## 从源码编译（OpenWrt SDK）

将本目录放到 OpenWrt SDK（如 `openwrt-sdk-24.10.x`）的 `package/luci-app-pppoe-ip-log`，然后运行：

```sh
./scripts/feeds update -a
./scripts/feeds install -a
make package/luci-app-pppoe-ip-log/compile V=s
```

编译产物包含两个 `.ipk` 文件，文件名中带有版本号与架构（例如 `luci-app-pppoe-ip-log_1.2_x86_64.ipk`）：

- `luci-app-pppoe-ip-log_*.ipk` — 应用本体（英文字符串）。
- `luci-i18n-pppoe-ip-log-zh-cn_*.ipk` — 简体中文翻译（由 `po/zh_Hans` 自动生成）。

> 注意：三个可执行脚本（`root/etc/init.d/pppoe-ip-log`、`root/etc/hotplug.d/iface/95-pppoe-ip-log`、`root/usr/sbin/pppoe-ip-log`）必须在仓库中保留可执行位，否则打包安装会出错。

## 许可证

Apache License 2.0。

[English](README.md) | [简体中文](README.zh.md)

# luci-app-pppoe-ip-log

A LuCI application for OpenWrt / ImmortalWrt that records the public IPv4
address of monitored PPPoE (or any WAN) interfaces whenever it changes, and
shows the change history directly in the web interface.

## Why

Many ISPs hand out a dynamic public IP over PPPoE that changes from time to
time (after a reconnect, a line drop, or a lease renewal). This package keeps
a timestamped log of every change so you can answer questions like "when did
my public IP last change?" or "has my IP been stable?" without digging through
system logs.

## Features

- Records the time, previous address and new address for every change.
- Monitors PPPoE interfaces automatically (or a fixed interface you choose).
- Background daemon polls on a configurable interval and also reacts to
  hotplug `iface` events for immediate logging.
- **Public IP discovery (CGNAT-friendly, off by default):** besides the local
  interface address, the public-facing IPv4 address can be fetched from an
  external echo service, so the log is meaningful even when the WAN only sees a
  carrier-grade NAT address (100.64.0.0/10). Both values are recorded, and the
  public-address columns are shown only while the option is enabled.
- Web UI under **Network → PPPoE IP Log** with a current-status panel and a
  change-history table, plus a "Clear log" action.
- The change history lists the address after each change (no old/new pairing).
- The installed package version is shown in the page title (e.g. `v1.0-r6`).
- Simplified Chinese translation included (`luci-i18n-pppoe-ip-log-zh-cn`).

## Installation

Install both the application and the translation package:

```sh
opkg update
opkg install luci-app-pppoe-ip-log
opkg install luci-i18n-pppoe-ip-log-zh-cn
```

Then open the web interface at **Network → PPPoE IP Log**.

## Usage

The change history is available immediately after install. The daemon starts
automatically and logs the first sample on its first run.

Settings (Network → PPPoE IP Log → Settings):

| Option      | Default | Description                                                       |
|-------------|---------|-------------------------------------------------------------------|
| `enabled`   | `1`     | Enable/disable monitoring.                                       |
| `interface` | `auto`  | `auto` = all PPPoE interfaces; otherwise a space-separated list (e.g. `wan`). |
| `interval`  | `30`    | Daemon poll interval in seconds.                                 |
| `max_entries` | `500` | Maximum number of history lines kept (oldest are trimmed).     |
| `public_ip_lookup` | `0` | Also query an external echo service for the public-facing IPv4 address (CGNAT-friendly). Disabled by default; while it is off the UI hides the public-address columns and only the interface address is logged. |
| `echo_url` | several | One or more URLs (list) that return the caller IPv4 as plain text; tried in order until one succeeds. |

## How it works

- `/usr/sbin/pppoe-ip-log` is the backend script. It exposes `check`,
  `clear`, `daemon`, `status` and `interfaces` actions.
- A hotplug script (`/etc/hotplug.d/iface/95-pppoe-ip-log`) triggers a check
  whenever an interface comes up.
- The procd init script (`/etc/init.d/pppoe-ip-log`) launches the daemon.
- Data is stored in `/etc/pppoe-ip-log/`:
  - `history.log` — tab-separated change records (`epoch<TAB>time<TAB>iface<TAB>old_public<TAB>new_public<TAB>old_interface<TAB>new_interface`). A `-` is written for unavailable values, and the UI displays only the post-change (new) addresses.
  - `state` — last known interface and public address per interface (`-` when unknown; the placeholder keeps the column layout stable).
  - `status.json` — current status consumed by the web UI (`address` = interface IP, `public_address` = public-facing IP, `public_lookup` = whether public-IP discovery is enabled, `version` = installed package version).

## Building from source (OpenWrt SDK)

Place this directory at `package/luci-app-pppoe-ip-log` inside an OpenWrt SDK
(e.g. `openwrt-sdk-24.10.x`) and run:

```sh
./scripts/feeds update -a
./scripts/feeds install -a
make package/luci-app-pppoe-ip-log/compile V=s
```

The build produces two `.ipk` files whose names embed the version and
architecture (e.g. `luci-app-pppoe-ip-log_1.0-r6_x86_64.ipk`):

- `luci-app-pppoe-ip-log_*.ipk` — the application (English strings).
- `luci-i18n-pppoe-ip-log-zh-cn_*.ipk` — Simplified Chinese translation
  (derived automatically from `po/zh_Hans`).

> Note: the three executable scripts (`root/etc/init.d/pppoe-ip-log`,
> `root/etc/hotplug.d/iface/95-pppoe-ip-log` and `root/usr/sbin/pppoe-ip-log`)
> must keep their executable bit in the repository so the package installs
> correctly.

## License

Apache License 2.0.

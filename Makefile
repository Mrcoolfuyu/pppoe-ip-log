include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-pppoe-ip-log

PKG_NAME:=$(LUCI_NAME)
PKG_VERSION:=1.0
PKG_RELEASE:=3

PKG_MAINTAINER:=WorkBuddy
PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=PPPoE IP Log
LUCI_DESCRIPTION:=Records the public IPv4 address of the monitored PPPoE interfaces whenever it changes, optionally discovers the public-facing address via an external echo service (CGNAT-friendly), and displays the change history in LuCI.
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature

# The package tree builds two ipk files:
#   luci-app-pppoe-ip-log        - the application itself (English source strings)
#   luci-i18n-pppoe-ip-log-zh-cn - Simplified Chinese translation (po/zh_Hans)

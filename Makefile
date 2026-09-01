include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-pppoe-ip-log

PKG_NAME:=$(LUCI_NAME)
# Versioning: bump PKG_VERSION by one on every change (1.2 -> 1.3 -> ...).
# PKG_RELEASE stays at 1 - do not use it to track changes.
PKG_VERSION:=1.2
PKG_RELEASE:=1

PKG_MAINTAINER:=Mrcool <ns.mrcool@gmail.com>
PKG_LICENSE:=Apache-2.0

# luci.mk defaults LUCI_MAINTAINER to "OpenWrt LuCI community"; override it so
# the generated package metadata carries the real author.
LUCI_MAINTAINER:=Mrcool <ns.mrcool@gmail.com>

LUCI_TITLE:=PPPoE IP Log
LUCI_DESCRIPTION:=Records the public IPv4 address of the monitored PPPoE interfaces whenever it changes, optionally discovers the public-facing address via an external echo service (CGNAT-friendly), and displays the change history in LuCI.
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature

# The package tree builds two ipk files:
#   luci-app-pppoe-ip-log        - the application itself (English source strings)
#   luci-i18n-pppoe-ip-log-zh-cn - Simplified Chinese translation (po/zh_Hans)

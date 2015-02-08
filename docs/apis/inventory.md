# Inventory Service

## Devices

### List devices

List all devices visible by the current authenticated user:

```js
card.services('inventory').request('devices'[, options])
```

#### Options

Name | Type | Description
-----|------|--------------
`scan_state`|`string`| Return devices that were in this state during the last scan. Can be either `'inventoried'`,  `'offline'`, or `'unknown'`. 


#### Response
```js
{
  "meta": {
    "total_entries": 166,
    "page_count": 6,
    "per_page": 30,
    "current_page": 1
  },
  "devices": [...] // see below for device json example
}
```


### Get a single device

```js
card.services('inventory').request('devices', id)
```

#### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the device

#### Response

Example computer (note all arrays have been reduced to a single example 
item):

```js
{
  "id": 2,
  "type": "Computer",
  "server_name": "unsightly-sloth.workgroup",
  "name": "unsightly-sloth",
  "domain": "workgroup",
  "manually_added": false,
  "device_type": "Laptop",
  "description": "AT/AT COMPATIBLE",
  "location": null,
  "manufacturer": "Hewlett-Packard",
  "model": "ProBook 650 G1",
  "memory": 17088729088,
  "os_architecture": "64 bit",
  "number_of_processors": 1,
  "processor_architecture": "x64",
  "processor_type": "Intel Core i5-4200M 2.50GHz",
  "kernel": null,
  "operating_system": "Windows 7 Pro",
  "version": "6.1.7601",
  "service_pack_major_version": 1,
  "service_pack_minor_version": 0,
  "windows_product_id": "00371-868-0000007-85065",
  "management_oid": null,
  "number_of_licensed_users": 0,
  "bios_date": "2013-12-05T00:00:00-06:00",
  "bios_version": "L77 Ver. 01.02",
  "page_count": null,
  "mac_address": "DC:AD:D8:47:31:17",
  "ip_address": "169.108.36.132",
  "ip_comparable": 2842436740,
  "os_serial_number": "63034-882-6985763-83972",
  "asset_tag": "8175730DBE",
  "serial_number": "8175730DBE",
  "uuid": "39622E44-ABEB-C8D8-755E-44463108B330",
  "reported_by_id": null,
  "site_id": 1,
  "created_at": "2015-02-04T12:56:38-06:00",
  "updated_at": "2015-02-05T14:53:15-06:00",
  "scan_state": "inventoried",
  "install_date": "2014-05-30T20:40:42-05:00",
  "last_backup_time": null,
  "last_boot_up_time": "2015-02-04T10:57:36-06:00",
  "last_qrcode_time": null,
  "last_scan_time": "2015-02-04T13:50:48-06:00",
  "offline_at": null,
  "online_at": "2015-02-04T13:50:48-06:00",
  "up_time": null,
  "owner": null,
  "network_adapters": [
    {
      "name": "NETwNs64",
      "net_connection_id": "Wireless Network Connection",
      "description": "Intel(R) Centrino(R) Advanced-N 6235",
      "ip_address": "155.204.103.38",
      "ip_comparable": 2613864230,
      "gateway": "116.252.52.186",
      "net_mask": "255.255.252.0",
      "mac_address": "9B:1D:03:22:A3:BC",
      "dns_domain": "example.com",
      "dns_servers": "196.249.135.102 173.17.111.2 40.144.154.113",
      "dhcp_enabled": "true",
      "dhcp_server": "191.138.14.168",
      "ip_addresses": [
        "10.10.48.35",
        "fe80::9c43:4df5:dc5b:1252"
      ]
    }
  ],
  "video_adapters": [
    {
      "name": "Intel(R) HD Graphics 4600",
      "device_name": "VideoController1",
      "drivers": [
        "igdumdim64.dll",
        "igd10iumd64.dll",
        "igd10iumd64.dll",
        "igdumdim32",
        "igd10iumd32",
        "igd10iumd32"
      ],
      "driver_version": "9.18.10.3324",
      "driver_date": "2013-10-07T00:00:00-05:00",
      "video_processor": "Intel(R) HD Graphics Family"
    }
  ],
  "monitors": [
    {
      "name": "Generic PnP Monitor",
      "manufacturer": "Samsung Electric Co",
      "model": "S24C200",
      "screen_height": 1080,
      "screen_width": 1920,
      "monitor_type": "Generic PnP Monitor",
      "manufacturer_date": "2014-04-28",
      "serial_number": "2D8B19A1"
    }
  ],
  "printers": [
    {
      "name": "Fax",
      "default": "false",
      "print_processor": "winprint",
      "printer_device": "Fax",
      "horizontal_resolution": "200",
      "vertical_resolution": "200"
    }
  ],
  "peripherals": [
    {
      "name": "HP HD Webcam",
      "manufacturer": "Lite-On Technology Corp.",
      "product_identifier": "7025",
      "vendor_identifier": "04CA",
      "service": "USBVIDEO",
      "source": "USB",
      "status": "OK",
      "windows_device_id": "USB\\VID_04CA&PID_7025"
    }
  ],
  "memory_slots": [
    {
      "name": "Top - Slot 1 (top)",
      "status": "",
      "memory_type": "",
      "speed": "1600",
      "size": 8589934592,
      "max_capacity": 8589934592
    },
    {
      "name": "Top - Slot 2 (under)",
      "status": "",
      "memory_type": "",
      "speed": "1600",
      "size": 8589934592,
      "max_capacity": 8589934592
    }
  ],
  "logical_disks": [
    {
      "name": "C:",
      "description": "Local Disk",
      "file_system": "NTFS",
      "free_space": 31873048576,
      "size": 255953203200,
      "volume_name": null
    }
  ],
  "physical_disks": [
    {
      "name": "0",
      "manufacturer": null,
      "model": "WD My Passport 0830 USB Device",
      "size": 1000169372160,
      "status": "OK",
      "interface": "USB",
      "firmware": "1056",
      "failure_prediction": "unsupported",
      "is_solid_state": true,
      "partitions": [
        {
          "name": "Disk #1, Partition #0",
          "partition_type": null,
          "size": 1000169537536,
          "starting_offset": 1048576,
          "free_space": 560203796480
        }
      ],
      "serial_number": "194D1970"
    }
  ],
  "software": [
    {
      "name": "Google Chrome",
      "display_name": "Google Chrome",
      "version": "40.0.2214.94",
      "vendor": "Google",
      "summary": null,
      "url_about_info": "",
      "url_update_info": "",
      "install_date": "2014-06-02",
      "install_location": null,
      "uninstall_string": "\"C:\\Program Files (x86)\\Google\\Chrome\\Application\\40.0.2214.94\\Installer\\setup.exe\" --uninstall --multi-install --chrome --system-level",
      "identity": "Google Chrome",
      "product_key": null
    }
  ]
}
```

Example switch (note all arrays have been reduced to a single example 
item):

```js
{
  "id": 475,
  "type": "SnmpDevice",
  "server_name": "clean-octopus.example.com",
  "name": "clean-octopus",
  "domain": "example.com",
  "manually_added": false,
  "device_type": "Switch",
  "description": "Cisco IOS Version: 12.2(58)SE2 Model: WS-C2960S-48FPD-L",
  "location": null,
  "manufacturer": "Cisco",
  "model": "WS-C2960S-48FPD-L",
  "memory": 0,
  "os_architecture": null,
  "number_of_processors": null,
  "processor_architecture": null,
  "processor_type": null,
  "kernel": null,
  "operating_system": "Cisco IOS",
  "version": "12.2(58)SE2",
  "service_pack_major_version": null,
  "service_pack_minor_version": null,
  "windows_product_id": null,
  "management_oid": "1.3.6.1.4.1.9.1.1208",
  "number_of_licensed_users": null,
  "bios_date": null,
  "bios_version": null,
  "page_count": null,
  "mac_address": null,
  "ip_address": "48.188.254.146",
  "ip_comparable": 817692306,
  "os_serial_number": null,
  "asset_tag": null,
  "serial_number": "48.188.254.146",
  "uuid": null,
  "reported_by_id": null,
  "site_id": 1,
  "created_at": "2015-02-04T16:25:35-06:00",
  "updated_at": "2015-02-05T14:52:38-06:00",
  "scan_state": "inventoried",
  "install_date": null,
  "last_backup_time": null,
  "last_boot_up_time": "2014-04-15T22:04:44-05:00",
  "last_qrcode_time": null,
  "last_scan_time": "2015-02-04T17:18:18-06:00",
  "offline_at": null,
  "online_at": "2015-02-04T17:18:18-06:00",
  "up_time": null,
  "owner": null,
  "vlans": [
    {
      "vlan": "Wireless VLAN",
      "ports": [
        {
          "name": "TenGigabitEthernet2/0/1",
          "neighbors": [
            {
              "ip_address": null,
              "mac_address": "02:21:16:08:9C:B7",
              "status": "learned"
            }
          ]
        }
      ]
    }
  ],
  "ports": [
    {
      "name": "Vlan1",
      "speed": 1000000000,
      "if_type": "propVirtual",
      "if_index": "1",
      "admin_status": "down",
      "op_status": "down",
      "ip_address": null,
      "net_mask": null,
      "mac_address": "D4:A4:38:0C:1D:A0"
    }
  ]
}
```

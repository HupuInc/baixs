## URL 监控接口示例

* 新增监控地址
```bash
curl -XPOST http://server/api/links -d '{url: "http://www.hupu.com", proxy: "http://192.168.1.1"}'
```

* 删除监控地址
```bash
curl -XDELETE http://server/api/links/$id
```

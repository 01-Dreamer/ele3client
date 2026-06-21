# Ele3 前端接口说明

本文档不维护具体接口清单。后端代码仍在持续变化，任何接口路径、请求体、返回体、权限规则都必须以源码为准。

当需要编写、补充、修正前端接口文档或对接代码时，请 AI 直接读取后端源码目录：

```text
/home/failedman/ele3/ele3server
```

## 后端模块

当前后端工程包含以下服务模块：

```text
auth-service
user-service
shop-service
order-service
payment-service
message-service
risk-service
agent-service
file-service
location-service
gateway-service
common-service
```

当前后端工程根目录还包含：

```text
AGENTS.md
CLAUDE.md
HELP.md
doc.md
pom.xml
mvnw
mvnw.cmd
target
.agents
.claude
.codex
.github
.mvn
.vscode
.git
.gitignore
.gitattributes
```

## 接口读取规则

需要获取接口信息时，请优先读取各服务源码中的以下内容：

```text
controller
request
dto
vo
entity
client
config
handler
listener
```

重点以 Controller 层注解为准，例如：

```text
@RequestMapping
@GetMapping
@PostMapping
@PutMapping
@DeleteMapping
@PatchMapping
```

请求参数以 Request、DTO、方法参数、PathVariable、RequestParam、RequestBody 为准。

返回结构以 VO、DTO、统一响应包装类以及 Controller 实际返回值为准。

权限规则以 gateway-service、各服务拦截器、过滤器、Security 配置、注解和业务代码为准。

## 网关规则

前端默认通过 gateway-service 访问后端接口。

默认本地网关地址：

```text
http://127.0.0.1:18000
```

如果前端需要访问受保护接口，一般需要携带：

```text
Authorization: Bearer <token>
```

公共接口、管理员接口、内部接口、WebSocket 接口的具体路径不要从本文档推断，必须读取源码确认。

## 前端响应提示规则

后端 HTTP 接口统一返回结构包含 `code`、`message`、`data`、`timestamp`。

前端请求封装和页面错误处理必须执行以下规则：

```text
只要后端响应体中的 code 不是 200，就必须使用 Element Plus 的 ElMessage 将后端返回的 message 展示给用户，提示时长统一为 2 秒。
```

当前前端统一请求层应从后端响应中提取 `message` 并抛出错误，页面 `catch` 中必须调用统一错误提示函数展示该错误，不要吞掉后端 `message`。如果某个轮询接口不希望前端反复弹错误提示，后端应在等待状态下返回 `code: 200`，并通过 `data/status` 等业务字段表达等待状态。

## 风控验证码规则

如果后端统一响应返回：

```json
{
  "code": 40103,
  "message": "请提交验证码"
}
```

前端统一请求层必须拦截该状态，弹出滑块验证码；验证码通过后调用 risk-service 的公开接口 `/api/risk/public/captcha/clear-risk-by-slider` 清除当前用户风险分，然后自动重试原请求一次。

验证码获取接口和清除风控接口自身必须跳过该拦截，避免递归触发。

## AI 生成接口文档时的要求

当用户要求生成某个服务或某个功能的接口文档时，请按下面流程处理：

```text
1. 进入 /home/failedman/ele3/ele3server
2. 找到对应服务模块
3. 读取 Controller 源码
4. 读取相关 Request / DTO / VO
5. 读取权限和路由配置
6. 再生成当前真实可用的接口文档
```

可优先搜索：

```bash
find /home/failedman/ele3/ele3server -path '*/src/main/java/*' -name '*Controller.java'
find /home/failedman/ele3/ele3server -path '*/src/main/java/*' \( -name '*Request.java' -o -name '*DTO.java' -o -name '*VO.java' \)
```

也可以使用：

```bash
grep -R "@RequestMapping\|@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping" /home/failedman/ele3/ele3server/*-service/src/main/java
```

## 文档维护原则

本文档只记录项目结构和接口读取规则，不写死具体接口。

如果源码和历史接口说明不一致，永远以源码为准。

如果需要给前端生成接口文档，应当基于当时的源码重新生成，而不是复用旧的接口列表。

如果后端代码发生变化，不需要手动同步修改本文档中的接口列表，因为本文档不保存接口列表。

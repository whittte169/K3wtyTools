const CONFIG = {
  owner: "whittte169",
  cores: [
    { id: "PaperMC", color: "#4f9dff" },
    { id: "PurpurMC", color: "#b45cff" },
    { id: "Nukkit-MOT", color: "#00f0ff" },
    { id: "EndstoneMC", color: "#f4f06a" },
    { id: "PumpkinMC", color: "#ff9a1f" }
  ],
  projects: [
    {
      id: "k3wty-chat-manager",
      name: "K3wtyChatManager",
      category: "plugin",
      repo: "K3wtyChatManager",
      description: {
        en: "Customizable chat with prefixes, colors and formatting.",
        ru: "Настраиваемый чат с префиксами, цветами и форматированием.",
        zh: "支持前缀、颜色和格式的可自定义聊天。"
      },
      images: [],
      versions: [
        {
          version: "1.0.0",
          cores: {
            "Nukkit-MOT": { tag: "plugin", file: "ChatManagerSystem-{version}.jar" }
          }
        }
      ]
    },
    {
      id: "k3wty-economy",
      name: "K3wtyEconomy",
      category: "plugin",
      repo: "K3wtyEconomy",
      description: {
        en: "Economy with balances, a shop and player-to-player transfers.",
        ru: "Экономика с балансами, магазином и переводами между игроками.",
        zh: "包含余额、商店和玩家间转账的经济系统。"
      },
      images: [],
      versions: [
        {
          version: "1.0.0",
          cores: {
            EndstoneMC: { tag: "endstone", file: "endstone_k3wty_economy-{version}-py2.py3-none-any.whl" }
          }
        }
      ]
    },
    {
      id: "uuid-generator",
      name: "UUID Generator",
      category: "site",
      repo: "K3wty-UUID-generator",
      url: "https://whittte169.github.io/K3wty-UUID-generator/",
      description: {
        en: "Generate UUIDs for your server, plugins and configs.",
        ru: "Генерация UUID для сервера, плагинов и конфигов.",
        zh: "为服务器、插件和配置生成 UUID。"
      },
      images: [],
      versions: []
    },
    {
      id: "image-encryptor",
      name: "Image Encryptor",
      category: "site",
      repo: "K3wty-image-encrypter",
      url: "https://whittte169.github.io/K3wty-image-encrypter/",
      description: {
        en: "Encrypt images before using them in your project.",
        ru: "Шифрование изображений перед использованием в проекте.",
        zh: "在项目中使用图片前先对其加密。"
      },
      images: [],
      versions: []
    }
  ]
};

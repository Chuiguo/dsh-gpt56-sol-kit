# Security

Please report suspected credential exposure or a tool-policy bypass privately to the repository owner through GitHub's security reporting feature when available.

Do not include API keys, Authorization headers, private relay URLs, session logs, or user files in a public issue.

The plugin does not register a provider, send HTTP requests, read credentials, or modify the DSH sandbox. Security-sensitive enforcement remains in the DSH host and the plugin's tool guard.

from typing import Protocol


class ContentProvider(Protocol):
    def generate(self, prompt: str, context: dict) -> str: ...


class LocalTemplateProvider:
    name = "local"

    def generate(self, prompt, context):
        return prompt.format(**context)


def get_content_provider(name=None):
    return LocalTemplateProvider()

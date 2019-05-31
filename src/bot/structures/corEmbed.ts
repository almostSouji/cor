import { MessageEmbed } from "discord.js";

function ellipsis(text: string, length: number): string {
  if (text.length > length) {
    return `${text.slice(0, length - 3)}...`;
  } else {
    return text;
  }
}

export default class CorEmbed extends MessageEmbed {
  private limits = {
    title: 256,
    description: 2048,
    footer: 2048,
    author: 256,
    fields: 25,
    fieldName: 256,
    fieldValue: 1024
  };

  private constructor(data = { color: 3553599 }) {
    super(data);
  }

  public applySpacers(): CorEmbed {
    for (let i = 0; i < this.fields.length - 1; i++) {
      this.fields[i].value += `\n\u200B`;
    }
    return this;
  }

  public shorten(): CorEmbed {
    if (this.fields.length > this.limits.fields) {
      this.fields = this.fields.slice(0, this.limits.fields);
    }
    if (this.author && this.author.name) {
      this.author.name = ellipsis(this.author.name, this.limits.author);
    }
    if (this.footer && this.footer.text) {
      this.footer.text = ellipsis(this.footer.text, this.limits.footer);
    }
    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i];

      field.name = ellipsis(field.name, this.limits.fieldName);
      field.value = ellipsis(field.value, this.limits.fieldValue);
    }
    return this;
  }
}

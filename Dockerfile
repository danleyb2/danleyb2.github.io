FROM ruby:3.2-slim AS jekyll

WORKDIR /srv/jekyll

# Install node for Jekyll assets (Sass, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock ./
RUN bundle install

EXPOSE 4000
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000"]

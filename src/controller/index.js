const baseUrl = require("../constant/url");
const services = require("../helper/service");
const cheerio = require("cheerio");

const fetchRecipes = (req, res, response) => {
  try {
    const $ = cheerio.load(response.data);
    const element = $("._recipes-list");
    let title, thumb, duration, difficulty, endpoint;
    let recipe_list = [];
    element.find("._recipe-card").each((i, e) => {
      title = $(e).find(".stretched-link").attr("data-tracking-value");
      thumb = $(e).find(".thumbnail").find("img").attr("data-src");
      endpoint = $(e).find(".card-title a").attr("href").split("/");
      duration = $(e).find("._recipe-features").find("span").text();
      difficulty = $(e)
        .find("._recipe-features")
        .find(".icon_difficulty")
        .text()
        .trim();
      kkal = $(e).find("._recipe-features").find(".icon_fire").text().trim();

      recipe_list.push({
        title: title,
        thumb: thumb,
        endpoint: endpoint[4],
        features: { times: duration, difficulty: difficulty, kkal: kkal },
      });
    });
    console.log("fetch new recipes");

    const pageNumber = $("._pagination-button")
      .find(".last")
      .attr("href")
      .match(/page\/(\d+)\//)[1];

    res.send({
      method: req.method,
      status: true,
      results: { recipe_list: recipe_list, lastPage: pageNumber },
    });
  } catch (error) {
    throw error;
  }
};

const limiterRecipes = (req, res, response, limiter) => {
  try {
    const $ = cheerio.load(response.data);
    const element = $("._recipes-list");
    let title, thumb, duration, difficulty, endpoint, kkal;
    let recipe_list = [];
    element.find("._recipe-card").each((i, e) => {
      title = $(e).find(".stretched-link").attr("data-tracking-value");
      thumb = $(e).find(".thumbnail").find("img").attr("data-src");
      endpoint = $(e).find(".card-title a").attr("href").split("/");
      duration = $(e).find("._recipe-features").find("span").text() || "";
      difficulty = $(e)
        .find("._recipe-features")
        .find(".icon_difficulty")
        .text()
        .trim();
      kkal = $(e).find("._recipe-features").find(".icon_fire").text().trim();

      recipe_list.push({
        title: title,
        thumb: thumb,
        endpoint: endpoint[4],
        features: { times: duration, difficulty: difficulty, kkal: kkal },
      });
    });

    const recipes_limit = recipe_list.splice(0, limiter);
    if (limiter > 15) {
      res.send({
        method: req.method,
        status: false,
        message:
          "oops , you fetch a exceeded of limit, please set a limit below of 10",
        results: null,
      });
    } else {
      res.send({
        method: req.method,
        status: true,
        results: recipes_limit,
      });
    }
  } catch (error) {
    throw error;
  }
};

const searchRecipes = async (req, res, response) => {
  try {
    const $ = cheerio.load(response.data);
    const element = $("#recipesTab");

    let title, endpoint, key, thumb, feature;
    let search_list = [];
    element
      .find("._recipes-list")
      .find("._recipe-card")
      .each((i, e) => {
        title = $(e).find(".card-title").text().trim();
        endpoint = $(e)
          .find(".card-title a")
          .attr("href")
          .split("/")
          .slice(-2, -1)[0];
        thumb = $(e).find(".thumbnail").find("img").attr("data-src");
        let featuresArr = [];
        $(e)
          .find("._recipe-features")
          .find("a")
          .each((i, e) => {
            feature = $(e).text().trim();
            featuresArr.push(feature);
          });
        search_list.push({
          title: title,
          thumb: thumb,
          key: key,
          endpoint: endpoint,
          features: featuresArr,
        });
      });

    let pageNumber;
    const lastPageLink = $("._pagination-button").find(".last").attr("href");

    lastPageLink
      ? (pageNumber = lastPageLink.match(/page\/(\d+)\//)[1])
      : (pageNumber = 0);

    res.send({
      method: req.method,
      status: true,
      results: { search_list: search_list, lastPage: pageNumber },
    });
  } catch (error) {
    throw error;
  }
};

const Controller = {
  newRecipes: async (req, res) => {
    try {
      const response = await services.fetchService(`${baseUrl}/resep/`, res);
      return fetchRecipes(req, res, response);
    } catch (error) {
      throw error;
    }
  },

  newRecipesByPage: async (req, res) => {
    try {
      const page = req.params.page;
      const url = `${baseUrl}/resep/page/${page}/`;
      console.log(`Fetching data from: ${url}`);

      const response = await services.fetchService(url, res);
      return fetchRecipes(req, res, response);
    } catch (error) {
      throw error;
    }
  },

  category: async (req, res) => {
    try {
      const response = await services.fetchService(`${baseUrl}/resep/`, res);
      const $ = cheerio.load(response.data);
      const element = $("#menu-item-287");
      let category, endpoint;
      let category_list = [];
      element.find(".sub-menu li").each((i, e) => {
        category = $(e).find("a").attr("title");
        endpoint = $(e).find("a").attr("href").split("/").slice(-2, -1)[0];
        category_list.push({
          category: category,
          endpoint: endpoint,
        });
      });

      return res.send({
        method: req.method,
        status: true,
        results: category_list,
      });
    } catch (error) {
      throw error;
    }
  },

  article: async (req, res) => {
    try {
      const response = await services.fetchService(`${baseUrl}/artikel/`, res);
      const $ = cheerio.load(response.data);
      const element = $("._articles-list");
      let title, endpoint;
      let article_lists = [];
      element.find("._article-card").each((i, e) => {
        title = $(e).find(".card-title").find("a").text().trim();
        endpoint = $(e).find(".card-title").find("a").attr("href").split("/");
        article_lists.push({
          title: title,
          endpoint: endpoint[4],
        });
      });

      return res.send({
        method: req.method,
        status: true,
        results: article_lists,
      });
    } catch (error) {
      throw error;
    }
  },

  recipesByCategory: async (req, res) => {
    try {
      const key = req.params.key;
      const response = await services.fetchService(
        `${baseUrl}/resep/${key}`,
        res
      );
      return fetchRecipes(req, res, response);
    } catch (error) {
      throw error;
    }
  },

  imgCategory: async (req, res) => {
    try {
      const response = await services.fetchService(`${baseUrl}`, res);

      const $ = cheerio.load(response.data);
      const element = $("._categories-list");
      let title, thumb, endpoint;
      let imgCategory_list = [];
      element.find("li").each((i, e) => {
        title = $(e).find("a").text().trim();
        thumb = $(e).find("img").attr("data-src").trim();
        endpoint = $(e).find("a").attr("href").split("/") || "";

        if (i < 6) {
          imgCategory_list.push({
            title: title,
            thumb: thumb,
            endpoint: endpoint[4],
          });
        }
      });

      res.send({
        method: req.method,
        status: true,
        results: imgCategory_list,
      });
    } catch (error) {
      throw error;
    }
  },

  recipesCategoryByPage: async (req, res) => {
    try {
      const key = req.params.key;
      const page = req.params.page;
      const url = `${baseUrl}/resep/${key}/page/${page}/`;

      const response = await services.fetchService(url, res);
      return fetchRecipes(req, res, response);
    } catch (error) {
      throw error;
    }
  },

  recipesDetail: async (req, res) => {
    try {
      const key = req.params.key;
      const response = await services.fetchService(
        `${baseUrl}/resep/${key}`,
        res
      );
      const $ = cheerio.load(response.data);
      let title, thumb, author, desc, quantity, ingredient, portions, features;
      let difficultyArr = [];
      let object = {};

      const elementHeader = $("._recipe-header");
      const elementDesc = $("._rich-content").first();
      const elementNeeded = $("._product-popup");
      const elementIngredients = $("._recipe-ingredients");
      const elementTutorial = $("._recipe-steps");

      title = elementHeader.find("h1").text().trim();
      thumb = elementHeader.find(".image-wrapper").find("img").attr("src");
      if (thumb === undefined) {
        thumb = null;
      }
      author = elementHeader.find(".author").text().replace(/\s+/g, " ").trim();

      elementHeader
        .find("._recipe-features")
        .find("a")
        .each((i, e) => {
          features = $(e).text().trim();
          difficultyArr.push(features);
        });
      object.title = title;
      object.thumb = thumb;
      object.authors = author;
      object.features = difficultyArr;

      elementDesc.each((i, e) => {
        desc = $(e).find("p").text();
        object.desc = desc;
      });

      let thumb_item;
      let neededArr = [];
      elementNeeded.find(".card").each((i, e) => {
        thumb_item = $(e).find("img").attr("data-src");
        neededArr.push({
          thumb_item: thumb_item,
        });
      });

      object.needItem = neededArr;

      let ingredientsArr = [];
      elementIngredients.find(".d-flex").each((i, e) => {
        quantity = $(e).find(".part").attr("data-base-quantity");
        ingredient = $(e).find(".item").text().trim().replace(/\s+/g, " ");

        if (ingredient) {
          ingredientsArr.push({ quantity, quantity, ingredient: ingredient });
        }
      });

      portions = elementIngredients
        .find(".portions")
        .find('input[name="portions-base"]')
        .val();

      object.portions = portions;
      object.ingredient = ingredientsArr;

      let step;
      let stepArr = [];
      elementTutorial.find(".step").each((i, e) => {
        step = $(e).find("p").text().trim();
        stepArr.push(step);
      });

      object.step = stepArr;

      res.send({
        method: req.method,
        status: true,
        results: object,
      });
    } catch (error) {
      throw error;
    }
  },

  searchRecipesBySearch: async (req, res) => {
    try {
      const query = req.query.q;
      const url = `${baseUrl}/?s=${query}`;
      const response = await services.fetchService(url, res);
      return searchRecipes(req, res, response);
    } catch (error) {
      res.status(500).send({ error: "Terjadi kesalahan dalam pencarian." });
    }
  },

  searchRecipesByPage: async (req, res) => {
    try {
      const query = req.params.q;
      const page = req.params.page;
      const url = `${baseUrl}/page/${page}/?s=${query}`;
      const response = await services.fetchService(url, res);

      return searchRecipes(req, res, response);
    } catch (error) {
      res.status(500).send({ error: "Terjadi kesalahan dalam pagination." });
    }
  },

  articleCategory: async (req, res) => {
    try {
      const response = await services.fetchService(baseUrl, res);
      const $ = cheerio.load(response.data);

      const element = $(".menu-item-286");
      let title, endpoint;
      let article_category_list = [];
      element
        .find(".sub-menu")
        .find(".menu-item")
        .each((i, e) => {
          title = $(e).find("a").text();
          endpoint = $(e).find("a").attr("href").split("/");
          article_category_list.push({
            title: title,
            endpoint: endpoint[3],
          });
        });

      res.send({
        method: req.method,
        status: true,
        results: article_category_list,
      });
    } catch (error) {
      throw error;
    }
  },

  articleByCategory: async (req, res) => {
    try {
      const key = req.params.key;
      const response = await services.fetchService(`${baseUrl}/${key}`, res);

      const $ = cheerio.load(response.data);
      const element = $("._articles-list");
      let title, thumb, endpoint;
      let article_list = [];
      element.find("._article-card").each((i, e) => {
        title = $(e).find(".card-title").find("a").text().trim();
        thumb = $(e).find(".thumbnail").find("img").attr("data-src").trim();
        endpoint = $(e).find(".card-title").find("a").attr("href").split("/");
        article_list.push({
          title: title,
          thumb: thumb,
          endpoint: endpoint[4],
        });
      });

      res.send({
        method: req.method,
        status: true,
        results: article_list,
      });
    } catch (error) {
      throw error;
    }
  },

  articleDetails: async (req, res) => {
    try {
      const tag = req.params.tag;
      const key = req.params.key;
      const response = await services.fetchService(
        `${baseUrl}/${tag}/${key}`,
        res
      );

      const $ = cheerio.load(response.data);
      const element = $("#article-page");

      let title, thumbs, author;
      let article_object = {};
      title = element.find("._article-header").find(".title").text().trim();
      author = element
        .find("._article-header")
        .find(".author")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      thumbs = element
        .find("._article-header")
        .find(".thumbnail")
        .find("img")
        .attr("src");

      let currentSection = null;
      const sections = [];

      const startNewSection = (headingText) => {
        if (currentSection) sections.push(currentSection);
        currentSection = { heading: headingText, paragraphs: [], images: "" };
      };

      $("._rich-content")
        .children()
        .each((i, el) => {
          const element = $(el);

          if (element.is("h2") || element.is("h3")) {
            const headingText = element.text().trim();
            startNewSection(headingText);
          } else if (element.is("p")) {
            const paragraphText = element
              .text()
              .replace(/<img[^>]*>/g, "")
              .trim();
            if (!currentSection) {
              startNewSection("");
            }
            currentSection.paragraphs.push(paragraphText);
          } else if (element.is("figure")) {
            const img = element.find("img");
            const imageUrl = img.attr("data-src")
              ? img.attr("data-src")
              : img.attr("src");
            if (!currentSection) {
              startNewSection("");
            }
            currentSection.images = imageUrl;
          }
        });

      if (currentSection) sections.push(currentSection);

      article_object.title = title;
      article_object.thumb = thumbs;
      article_object.author = author;
      article_object.articleContent = sections;

      res.send({
        method: req.method,
        status: true,
        results: article_object,
      });
    } catch (error) {
      throw error;
    }
  },

  newRecipesLimit: async (req, res) => {
    try {
      const response = await services.fetchService(`${baseUrl}/resep/`, res);
      const limit = req.query.limit;
      return limiterRecipes(req, res, response, limit);
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Controller;

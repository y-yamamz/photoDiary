package com.photo.backend;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.mybatis.generator.api.MyBatisGenerator;
import org.mybatis.generator.config.Configuration;
import org.mybatis.generator.config.xml.ConfigurationParser;
import org.mybatis.generator.internal.DefaultShellCallback;

public class MyBatisGeneratorRunner {

    public static void main(String[] args) throws Exception {
        List<String> warnings = new ArrayList<>();
        File configFile = new File("generatorConfig.xml");

        ConfigurationParser cp = new ConfigurationParser(warnings);
        Configuration config = cp.parseConfiguration(configFile);

        // ★ ここが答え
        config.getContexts().forEach(context -> {
            if (context.getJavaClientGeneratorConfiguration() != null) {
                context.getJavaClientGeneratorConfiguration()
                        .addProperty("mapperName", "{0}Dao");
                String val = context.getJavaClientGeneratorConfiguration().getProperty("mapperName");
                if (val == "") {

                }
            }
        });

        DefaultShellCallback callback = new DefaultShellCallback(true);
        MyBatisGenerator generator = new MyBatisGenerator(config, callback, warnings);
        generator.generate(null);

        warnings.forEach(System.out::println);
    }
}
